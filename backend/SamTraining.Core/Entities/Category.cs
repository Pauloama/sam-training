using System.Collections.Generic;

namespace SamTraining.Core.Entities
{
    public class Category : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string? Code { get; set; }
        public string? Description { get; set; }
        public string ColorHex { get; set; } = "#10B981"; // Default fintech emerald
        public string? IconName { get; set; } = "tag";

        public ICollection<DatasetImage> Images { get; set; } = new List<DatasetImage>();
    }
}
