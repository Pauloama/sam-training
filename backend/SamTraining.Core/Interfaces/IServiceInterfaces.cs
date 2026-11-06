using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;

namespace SamTraining.Core.Interfaces
{
    public interface IFileStorageService
    {
        Task<string> SaveImageAsync(Stream stream, string originalFileName, string contentType, CancellationToken cancellationToken = default);
        Task<string> SaveMaskAsync(byte[] maskBytes, string baseFileName, CancellationToken cancellationToken = default);
        Task<Stream?> GetFileStreamAsync(string relativePath, CancellationToken cancellationToken = default);
        Task DeleteFileAsync(string relativePath, CancellationToken cancellationToken = default);
        string GetPhysicalPath(string relativePath);
        string GetPublicUrl(string relativePath);
    }

    public interface IDatasetExportService
    {
        Task<string> ExportDatasetManifestAsync(string exportDirectory, CancellationToken cancellationToken = default);
    }

    public interface ITrainingCoordinatorService
    {
        Task<Guid> EnqueueTrainingJobAsync(
            string jobName,
            string? description,
            int epochs,
            int batchSize,
            double learningRate,
            bool freezeBackbone,
            CancellationToken cancellationToken = default);

        Task UpdateJobProgressAsync(
            Guid jobId,
            int epoch,
            int step,
            double trainLoss,
            double? valLoss,
            double? accuracy,
            double? meanIoU,
            string? logMessage,
            CancellationToken cancellationToken = default);

        Task MarkJobCompletedAsync(
            Guid jobId,
            string checkpointPath,
            double? bestAccuracy,
            double? bestMeanIoU,
            CancellationToken cancellationToken = default);

        Task MarkJobFailedAsync(Guid jobId, string errorMessage, CancellationToken cancellationToken = default);
    }

    public interface IInferenceService
    {
        Task<InferenceResultDto> ClassifyAndSegmentAsync(
            Stream imageStream, 
            string fileName, 
            string? promptJson = null,
            Guid? checkpointJobId = null,
            CancellationToken cancellationToken = default);
    }

    public class InferenceResultDto
    {
        public Guid? CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public double Confidence { get; set; }
        public string? MaskRelativePath { get; set; }
        public string? MaskBase64Png { get; set; }
        public int InferenceTimeMs { get; set; }
        public string ModelVersion { get; set; } = "SAM-3-FineTuned";
        public string? BoundingBoxJson { get; set; }
    }
}
