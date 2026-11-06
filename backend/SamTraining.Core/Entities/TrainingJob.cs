using System;
using System.Collections.Generic;
using SamTraining.Core.Enums;

namespace SamTraining.Core.Entities
{
    public class TrainingJob : BaseEntity
    {
        public string JobName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public TrainingJobStatus Status { get; set; } = TrainingJobStatus.Queued;
        
        public string BaseModel { get; set; } = "SAM-3-ViT-B";
        public int Epochs { get; set; } = 15;
        public int BatchSize { get; set; } = 4;
        public double LearningRate { get; set; } = 0.0001;
        public bool FreezeBackbone { get; set; } = true;
        
        public int TotalSamples { get; set; }
        public int CurrentEpoch { get; set; } = 0;
        public double? BestAccuracy { get; set; }
        public double? BestMeanIoU { get; set; }
        public double? CurrentLoss { get; set; }

        public string? CheckpointRelativePath { get; set; }
        public string? ConfigJson { get; set; }
        public string? Logs { get; set; }
        public string? ErrorMessage { get; set; }

        public DateTime? StartedAtUtc { get; set; }
        public DateTime? CompletedAtUtc { get; set; }

        public ICollection<TrainingMetric> Metrics { get; set; } = new List<TrainingMetric>();
    }
}
