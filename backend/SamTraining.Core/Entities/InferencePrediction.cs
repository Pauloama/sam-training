using System;

namespace SamTraining.Core.Entities
{
    public class InferencePrediction : BaseEntity
    {
        public string ImageRelativePath { get; set; } = string.Empty;
        public string? MaskRelativePath { get; set; }
        
        public Guid? PredictedCategoryId { get; set; }
        public Category? PredictedCategory { get; set; }
        
        public string PredictedCategoryName { get; set; } = string.Empty;
        public double ConfidenceScore { get; set; }
        public int InferenceTimeMs { get; set; }
        
        public Guid? ModelTrainingJobId { get; set; }
        public string ModelVersion { get; set; } = "SAM-3-FineTuned";
        
        public string? MaskPolygonGeoJson { get; set; }
        public string? PromptUsedJson { get; set; }
    }
}
