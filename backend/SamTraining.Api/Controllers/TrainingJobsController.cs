using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using SamTraining.Core.DTOs;
using SamTraining.Core.Entities;
using SamTraining.Core.Enums;
using SamTraining.Core.Interfaces;

namespace SamTraining.Api.Controllers
{
    [ApiController]
    [Route("api/training")]
    public class TrainingJobsController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ITrainingCoordinatorService _coordinatorService;
        private readonly IFileStorageService _storageService;

        public TrainingJobsController(
            IUnitOfWork unitOfWork,
            ITrainingCoordinatorService coordinatorService,
            IFileStorageService storageService)
        {
            _unitOfWork = unitOfWork;
            _coordinatorService = coordinatorService;
            _storageService = storageService;
        }

        [HttpGet("jobs")]
        public async Task<ActionResult<IReadOnlyList<TrainingJobResponse>>> GetRecentJobs(
            [FromQuery] int limit = 20, 
            CancellationToken cancellationToken = default)
        {
            var jobs = await _unitOfWork.TrainingJobs.GetRecentJobsAsync(limit, cancellationToken);
            var response = jobs.Select(MapJobToDto).ToList();
            return Ok(response);
        }

        [HttpGet("jobs/{id:guid}")]
        public async Task<ActionResult<TrainingJobResponse>> GetById(Guid id, CancellationToken cancellationToken)
        {
            var job = await _unitOfWork.TrainingJobs.GetWithMetricsAsync(id, cancellationToken);
            if (job == null) return NotFound();

            return Ok(MapJobToDto(job));
        }

        [HttpPost("jobs")]
        public async Task<ActionResult> EnqueueJob(
            [FromBody] CreateTrainingJobRequest request, 
            CancellationToken cancellationToken)
        {
            var totalImages = await _unitOfWork.DatasetImages.CountAsync(cancellationToken: cancellationToken);
            if (totalImages == 0)
            {
                return BadRequest(new { message = "Cannot start training: dataset has 0 images. Please upload images first." });
            }

            var jobId = await _coordinatorService.EnqueueTrainingJobAsync(
                request.JobName,
                request.Description,
                request.Epochs,
                request.BatchSize,
                request.LearningRate,
                request.FreezeBackbone,
                cancellationToken);

            return CreatedAtAction(nameof(GetById), new { id = jobId }, new { jobId, message = "Training job successfully enqueued." });
        }

        [HttpGet("jobs/pending")]
        public async Task<ActionResult<TrainingJobResponse>> GetNextPendingJob(CancellationToken cancellationToken)
        {
            var job = await _unitOfWork.TrainingJobs.GetNextQueuedJobAsync(cancellationToken);
            if (job == null) return NoContent();

            return Ok(MapJobToDto(job));
        }

        [HttpPost("jobs/{id:guid}/progress")]
        public async Task<IActionResult> UpdateProgress(
            Guid id, 
            [FromBody] UpdateTrainingProgressDto dto, 
            CancellationToken cancellationToken)
        {
            await _coordinatorService.UpdateJobProgressAsync(
                id,
                dto.Epoch,
                dto.Step,
                dto.TrainLoss,
                dto.ValLoss,
                dto.Accuracy,
                dto.MeanIoU,
                dto.LogMessage,
                cancellationToken);

            return Ok(new { success = true });
        }

        [HttpPost("jobs/{id:guid}/complete")]
        public async Task<IActionResult> MarkCompleted(
            Guid id, 
            [FromBody] CompleteTrainingJobDto dto, 
            CancellationToken cancellationToken)
        {
            await _coordinatorService.MarkJobCompletedAsync(
                id,
                dto.CheckpointPath,
                dto.BestAccuracy,
                dto.BestMeanIoU,
                cancellationToken);

            return Ok(new { success = true });
        }

        [HttpPost("jobs/{id:guid}/fail")]
        public async Task<IActionResult> MarkFailed(
            Guid id, 
            [FromBody] FailTrainingJobDto dto, 
            CancellationToken cancellationToken)
        {
            await _coordinatorService.MarkJobFailedAsync(id, dto.ErrorMessage, cancellationToken);
            return Ok(new { success = true });
        }

        [HttpGet("models")]
        public async Task<ActionResult> GetAvailableModels(CancellationToken cancellationToken)
        {
            var jobs = await _unitOfWork.TrainingJobs.FindAsync(
                j => j.Status == TrainingJobStatus.Completed && !string.IsNullOrEmpty(j.CheckpointRelativePath),
                cancellationToken);

            var models = jobs.OrderByDescending(j => j.CompletedAtUtc).Select(j => new
            {
                jobId = j.Id,
                modelName = j.JobName,
                baseModel = j.BaseModel,
                accuracy = j.BestAccuracy,
                meanIoU = j.BestMeanIoU,
                checkpointPath = j.CheckpointRelativePath,
                completedAtUtc = j.CompletedAtUtc
            });

            return Ok(models);
        }

        private TrainingJobResponse MapJobToDto(TrainingJob job)
        {
            return new TrainingJobResponse
            {
                Id = job.Id,
                JobName = job.JobName,
                Description = job.Description,
                Status = job.Status,
                BaseModel = job.BaseModel,
                Epochs = job.Epochs,
                BatchSize = job.BatchSize,
                LearningRate = job.LearningRate,
                FreezeBackbone = job.FreezeBackbone,
                TotalSamples = job.TotalSamples,
                CurrentEpoch = job.CurrentEpoch,
                BestAccuracy = job.BestAccuracy,
                BestMeanIoU = job.BestMeanIoU,
                CurrentLoss = job.CurrentLoss,
                CheckpointUrl = string.IsNullOrEmpty(job.CheckpointRelativePath) ? null : _storageService.GetPublicUrl(job.CheckpointRelativePath),
                Logs = job.Logs,
                ErrorMessage = job.ErrorMessage,
                StartedAtUtc = job.StartedAtUtc,
                CompletedAtUtc = job.CompletedAtUtc,
                CreatedAtUtc = job.CreatedAtUtc,
                Metrics = job.Metrics.Select(m => new TrainingMetricResponse
                {
                    Epoch = m.Epoch,
                    Step = m.Step,
                    TrainLoss = m.TrainLoss,
                    ValLoss = m.ValLoss,
                    Accuracy = m.Accuracy,
                    MeanIoU = m.MeanIoU,
                    LearningRate = m.LearningRate,
                    TimestampUtc = m.TimestampUtc
                }).ToList()
            };
        }
    }
}
