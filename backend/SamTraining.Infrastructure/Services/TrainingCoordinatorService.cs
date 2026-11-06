using System;
using System.Diagnostics;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SamTraining.Core.Entities;
using SamTraining.Core.Enums;
using SamTraining.Core.Interfaces;

namespace SamTraining.Infrastructure.Services
{
    public class TrainingCoordinatorService : ITrainingCoordinatorService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IDatasetExportService _exportService;
        private readonly IFileStorageService _storageService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<TrainingCoordinatorService> _logger;

        public TrainingCoordinatorService(
            IUnitOfWork unitOfWork,
            IDatasetExportService exportService,
            IFileStorageService storageService,
            IConfiguration configuration,
            ILogger<TrainingCoordinatorService> logger)
        {
            _unitOfWork = unitOfWork;
            _exportService = exportService;
            _storageService = storageService;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<Guid> EnqueueTrainingJobAsync(
            string jobName,
            string? description,
            int epochs,
            int batchSize,
            double learningRate,
            bool freezeBackbone,
            CancellationToken cancellationToken = default)
        {
            var totalImages = await _unitOfWork.DatasetImages.CountAsync(cancellationToken: cancellationToken);

            var job = new TrainingJob
            {
                JobName = string.IsNullOrWhiteSpace(jobName) ? $"SAM3-Run-{DateTime.UtcNow:yyyyMMddHHmmss}" : jobName,
                Description = description,
                Status = TrainingJobStatus.Queued,
                BaseModel = "SAM-3-ViT-B",
                Epochs = epochs > 0 ? epochs : 10,
                BatchSize = batchSize > 0 ? batchSize : 4,
                LearningRate = learningRate > 0 ? learningRate : 0.0001,
                FreezeBackbone = freezeBackbone,
                TotalSamples = totalImages,
                CurrentEpoch = 0,
                CreatedAtUtc = DateTime.UtcNow
            };

            await _unitOfWork.TrainingJobs.AddAsync(job, cancellationToken);
            await _unitOfWork.CommitAsync(cancellationToken);

            _logger.LogInformation("Enqueued Training Job {JobId} with {TotalImages} images", job.Id, totalImages);

            // Export dataset manifest for ML worker
            var exportDir = Path.Combine(_storageService.GetPhysicalPath("exports"), job.Id.ToString());
            await _exportService.ExportDatasetManifestAsync(exportDir, cancellationToken);

            // Attempt to trigger ML Worker in background if auto-start is configured
            _ = Task.Run(() => TryTriggerLocalWorkerAsync(job.Id, exportDir));

            return job.Id;
        }

        public async Task UpdateJobProgressAsync(
            Guid jobId,
            int epoch,
            int step,
            double trainLoss,
            double? valLoss,
            double? accuracy,
            double? meanIoU,
            string? logMessage,
            CancellationToken cancellationToken = default)
        {
            var job = await _unitOfWork.TrainingJobs.GetByIdAsync(jobId, cancellationToken);
            if (job == null) return;

            if (job.Status == TrainingJobStatus.Queued)
            {
                job.Status = TrainingJobStatus.Running;
                job.StartedAtUtc = DateTime.UtcNow;
            }

            job.CurrentEpoch = epoch;
            job.CurrentLoss = trainLoss;
            if (accuracy.HasValue && (job.BestAccuracy == null || accuracy > job.BestAccuracy))
            {
                job.BestAccuracy = accuracy;
            }
            if (meanIoU.HasValue && (job.BestMeanIoU == null || meanIoU > job.BestMeanIoU))
            {
                job.BestMeanIoU = meanIoU;
            }

            if (!string.IsNullOrEmpty(logMessage))
            {
                job.Logs = (job.Logs ?? "") + $"[{DateTime.UtcNow:HH:mm:ss}] Epoch {epoch}/{job.Epochs} - Loss: {trainLoss:F4} - {logMessage}\n";
            }

            var metric = new TrainingMetric
            {
                TrainingJobId = jobId,
                Epoch = epoch,
                Step = step,
                TrainLoss = trainLoss,
                ValLoss = valLoss,
                Accuracy = accuracy,
                MeanIoU = meanIoU,
                LearningRate = job.LearningRate,
                TimestampUtc = DateTime.UtcNow
            };

            await _unitOfWork.TrainingMetrics.AddAsync(metric, cancellationToken);
            _unitOfWork.TrainingJobs.Update(job);
            await _unitOfWork.CommitAsync(cancellationToken);
        }

        public async Task MarkJobCompletedAsync(
            Guid jobId,
            string checkpointPath,
            double? bestAccuracy,
            double? bestMeanIoU,
            CancellationToken cancellationToken = default)
        {
            var job = await _unitOfWork.TrainingJobs.GetByIdAsync(jobId, cancellationToken);
            if (job == null) return;

            job.Status = TrainingJobStatus.Completed;
            job.CheckpointRelativePath = checkpointPath;
            job.CompletedAtUtc = DateTime.UtcNow;
            if (bestAccuracy.HasValue) job.BestAccuracy = bestAccuracy.Value;
            if (bestMeanIoU.HasValue) job.BestMeanIoU = bestMeanIoU.Value;

            job.Logs = (job.Logs ?? "") + $"[{DateTime.UtcNow:HH:mm:ss}] Fine-tuning completed successfully! Checkpoint saved to: {checkpointPath}\n";

            _unitOfWork.TrainingJobs.Update(job);
            await _unitOfWork.CommitAsync(cancellationToken);
            _logger.LogInformation("Training Job {JobId} completed", jobId);
        }

        public async Task MarkJobFailedAsync(Guid jobId, string errorMessage, CancellationToken cancellationToken = default)
        {
            var job = await _unitOfWork.TrainingJobs.GetByIdAsync(jobId, cancellationToken);
            if (job == null) return;

            job.Status = TrainingJobStatus.Failed;
            job.ErrorMessage = errorMessage;
            job.CompletedAtUtc = DateTime.UtcNow;
            job.Logs = (job.Logs ?? "") + $"[{DateTime.UtcNow:HH:mm:ss}] ERROR: {errorMessage}\n";

            _unitOfWork.TrainingJobs.Update(job);
            await _unitOfWork.CommitAsync(cancellationToken);
            _logger.LogError("Training Job {JobId} failed: {Error}", jobId, errorMessage);
        }

        private async Task TryTriggerLocalWorkerAsync(Guid jobId, string exportDir)
        {
            try
            {
                var pythonPath = _configuration["MlEngine:PythonPath"] ?? "python";
                var workerScript = _configuration["MlEngine:WorkerScript"];
                
                if (string.IsNullOrEmpty(workerScript))
                {
                    var baseDir = AppContext.BaseDirectory;
                    var candidate = Path.GetFullPath(Path.Combine(baseDir, "..", "..", "..", "..", "ml-engine", "worker.py"));
                    if (File.Exists(candidate))
                    {
                        workerScript = candidate;
                    }
                }

                if (!string.IsNullOrEmpty(workerScript) && File.Exists(workerScript))
                {
                    _logger.LogInformation("Spawning ML worker for job {JobId}: {Script}", jobId, workerScript);
                    var manifestPath = Path.Combine(exportDir, "sam_dataset_manifest.json");
                    var psi = new ProcessStartInfo
                    {
                        FileName = pythonPath,
                        Arguments = $"\"{workerScript}\" --job-id {jobId} --manifest \"{manifestPath}\" --api-url \"http://localhost:5000\"",
                        UseShellExecute = false,
                        CreateNoWindow = true,
                        RedirectStandardOutput = true,
                        RedirectStandardError = true
                    };

                    using var process = Process.Start(psi);
                    if (process != null)
                    {
                        process.OutputDataReceived += (s, e) => { if (e.Data != null) _logger.LogDebug("[ML-Worker] {Data}", e.Data); };
                        process.ErrorDataReceived += (s, e) => { if (e.Data != null) _logger.LogWarning("[ML-Worker-Err] {Data}", e.Data); };
                        process.BeginOutputReadLine();
                        process.BeginErrorReadLine();
                        await process.WaitForExitAsync();
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not auto-start local ML worker process directly. Job will wait for standalone worker daemon.");
            }
        }
    }
}
