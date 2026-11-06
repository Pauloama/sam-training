using System;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using SamTraining.Core.Enums;
using SamTraining.Core.Interfaces;

namespace SamTraining.Infrastructure.Services
{
    public class DatasetExportService : IDatasetExportService
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IFileStorageService _storageService;

        public DatasetExportService(IUnitOfWork unitOfWork, IFileStorageService storageService)
        {
            _unitOfWork = unitOfWork;
            _storageService = storageService;
        }

        public async Task<string> ExportDatasetManifestAsync(string exportDirectory, CancellationToken cancellationToken = default)
        {
            Directory.CreateDirectory(exportDirectory);

            var categories = await _unitOfWork.Categories.GetAllAsync(cancellationToken);
            var (images, _) = await _unitOfWork.DatasetImages.GetPagedAsync(1, 100000, cancellationToken: cancellationToken);

            var categoryMap = categories.ToDictionary(c => c.Id, c => new
            {
                id = c.Id,
                name = c.Name,
                code = c.Code,
                color = c.ColorHex
            });

            var manifestImages = images.Select(img => new
            {
                id = img.Id,
                fileName = img.FileName,
                filePath = _storageService.GetPhysicalPath(img.RelativePath),
                maskPath = string.IsNullOrEmpty(img.MaskRelativePath) ? null : _storageService.GetPhysicalPath(img.MaskRelativePath),
                categoryId = img.CategoryId,
                categoryName = img.Category?.Name ?? (categoryMap.ContainsKey(img.CategoryId) ? categoryMap[img.CategoryId].name : "Unknown"),
                split = img.Split.ToString().ToLower(),
                bbox = img.BoundingBoxJson,
                promptPoints = img.PromptPointsJson,
                width = img.Width,
                height = img.Height,
                source = img.Source.ToString().ToLower()
            }).ToList();

            var manifest = new
            {
                exportedAtUtc = DateTime.UtcNow,
                version = "1.0",
                categories = categories.Select((c, idx) => new
                {
                    classIndex = idx,
                    id = c.Id,
                    name = c.Name,
                    code = c.Code,
                    color = c.ColorHex
                }).ToList(),
                stats = new
                {
                    totalImages = manifestImages.Count,
                    train = manifestImages.Count(i => i.split == "train"),
                    validation = manifestImages.Count(i => i.split == "validation"),
                    test = manifestImages.Count(i => i.split == "test")
                },
                images = manifestImages
            };

            var manifestPath = Path.Combine(exportDirectory, "sam_dataset_manifest.json");
            var jsonString = JsonSerializer.Serialize(manifest, new JsonSerializerOptions { WriteIndented = true });
            await File.WriteAllTextAsync(manifestPath, jsonString, cancellationToken);

            return manifestPath;
        }
    }
}
