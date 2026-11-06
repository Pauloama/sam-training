using System;

namespace SamTraining.Core.Entities
{
    public class TrainingMetric : BaseEntity
    {
        public Guid TrainingJobId { get; set; }
        public TrainingJob? TrainingJob { get; set; }

        public int Epoch { get; set; }
        public int Step { get; set; }
        public double TrainLoss { get; set; }
        public double? ValLoss { get; set; }
        public double? Accuracy { get; set; }
        public double? MeanIoU { get; set; }
        public double LearningRate { get; set; }
        public DateTime TimestampUtc { get; set; } = DateTime.UtcNow;
    }
}
