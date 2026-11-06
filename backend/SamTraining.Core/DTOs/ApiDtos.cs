using System;
using System.Collections.Generic;
using SamTraining.Core.Enums;

namespace SamTraining.Core.DTOs
{
    public class PagedResult<T>
    {
        public IReadOnlyList<T> Items { get; set; } = new List<T>();
        public int TotalCount { get; set; }
        public int PageIndex { get; set; }
        public int PageSize { get; set; }
        public int TotalPages => (int)Math.Ceiling((double)TotalCount / (PageSize > 0 ? PageSize : 1));
        public bool HasPreviousPage => PageIndex > 1;
        public bool HasNextPage => PageIndex < TotalPages;
    }

    public class CreateCategoryRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? Code { get; set; }
        public string? Description { get; set; }
        public string ColorHex { get; set; } = "#10B981";
        public string? IconName { get; set; } = "tag";
    }

    public class CategoryResponse
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Code { get; set; }
        public string? Description { get; set; }
        public string ColorHex { get; set; } = "#10B981";
        public string? IconName { get; set; }
        public int ImageCount { get; set; }
        public DateTime CreatedAtUtc { get; set; }
    }

    public class DatasetImageResponse
    {
        public Guid Id { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string OriginalFileName { get; set; } = string.Empty;
        public string Url { get; set; } = string.Empty;
        public string? MaskUrl { get; set; }
        public long FileSizeBytes { get; set; }
        public int Width { get; set; }
        public int Height { get; set; }
        public Guid CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public string CategoryColor { get; set; } = string.Empty;
        public DatasetSplit Split { get; set; }
        public CaptureSource Source { get; set; }
        public string? BoundingBoxJson { get; set; }
        public string? PromptPointsJson { get; set; }
        public string? MetadataJson { get; set; }
        public DateTime CreatedAtUtc { get; set; }
    }

    public class DatasetOverviewStatsResponse
    {
        public int TotalImages { get; set; }
        public int TotalCategories { get; set; }
        public int TrainCount { get; set; }
        public int ValidationCount { get; set; }
        public int TestCount { get; set; }
        public Dictionary<string, int> CategoryDistribution { get; set; } = new();
        public double HealthScorePercentage { get; set; }
        public string RecommendedAction { get; set; } = string.Empty;
    }

    public class CreateTrainingJobRequest
    {
        public string JobName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string BaseModel { get; set; } = "SAM-3-ViT-B";
        public int Epochs { get; set; } = 15;
        public int BatchSize { get; set; } = 4;
        public double LearningRate { get; set; } = 0.0001;
        public bool FreezeBackbone { get; set; } = true;
    }

    public class TrainingJobResponse
    {
        public Guid Id { get; set; }
        public string JobName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public TrainingJobStatus Status { get; set; }
        public string BaseModel { get; set; } = string.Empty;
        public int Epochs { get; set; }
        public int BatchSize { get; set; }
        public double LearningRate { get; set; }
        public bool FreezeBackbone { get; set; }
        public int TotalSamples { get; set; }
        public int CurrentEpoch { get; set; }
        public double? BestAccuracy { get; set; }
        public double? BestMeanIoU { get; set; }
        public double? CurrentLoss { get; set; }
        public string? CheckpointUrl { get; set; }
        public string? Logs { get; set; }
        public string? ErrorMessage { get; set; }
        public DateTime? StartedAtUtc { get; set; }
        public DateTime? CompletedAtUtc { get; set; }
        public DateTime CreatedAtUtc { get; set; }
        public IReadOnlyList<TrainingMetricResponse> Metrics { get; set; } = new List<TrainingMetricResponse>();
    }

    public class TrainingMetricResponse
    {
        public int Epoch { get; set; }
        public int Step { get; set; }
        public double TrainLoss { get; set; }
        public double? ValLoss { get; set; }
        public double? Accuracy { get; set; }
        public double? MeanIoU { get; set; }
        public double LearningRate { get; set; }
        public DateTime TimestampUtc { get; set; }
    }

    public class UpdateTrainingProgressDto
    {
        public int Epoch { get; set; }
        public int Step { get; set; }
        public double TrainLoss { get; set; }
        public double? ValLoss { get; set; }
        public double? Accuracy { get; set; }
        public double? MeanIoU { get; set; }
        public double? LearningRate { get; set; }
        public string? LogMessage { get; set; }
    }

    public class CompleteTrainingJobDto
    {
        public string CheckpointPath { get; set; } = string.Empty;
        public double? BestAccuracy { get; set; }
        public double? BestMeanIoU { get; set; }
    }

    public class FailTrainingJobDto
    {
        public string ErrorMessage { get; set; } = string.Empty;
    }
}
