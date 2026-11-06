using System;
using SamTraining.Core.Enums;

namespace SamTraining.Core.Entities
{
    public class DatasetImage : BaseEntity
    {
        public string FileName { get; set; } = string.Empty;
        public string OriginalFileName { get; set; } = string.Empty;
        public string ContentType { get; set; } = "image/jpeg";
        public long FileSizeBytes { get; set; }
        public string RelativePath { get; set; } = string.Empty;
        public string? ThumbnailRelativePath { get; set; }
        public string? MaskRelativePath { get; set; }

        public int Width { get; set; }
        public int Height { get; set; }

        public Guid CategoryId { get; set; }
        public Category? Category { get; set; }

        public DatasetSplit Split { get; set; } = DatasetSplit.Train;
        public CaptureSource Source { get; set; } = CaptureSource.Web;

        /// <summary>
        /// JSON with bounding box [x_min, y_min, x_max, y_max] or points used for SAM prompt
        /// </summary>
        public string? BoundingBoxJson { get; set; }

        /// <summary>
        /// JSON with prompt points [{"x": 120, "y": 80, "label": 1}]
        /// </summary>
        public string? PromptPointsJson { get; set; }

        /// <summary>
        /// Additional fintech metadata: confidence, tags, transaction reference, device info
        /// </summary>
        public string? MetadataJson { get; set; }
    }
}
