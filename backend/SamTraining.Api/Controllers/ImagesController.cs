using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SamTraining.Core.DTOs;
using SamTraining.Core.Entities;
using SamTraining.Core.Enums;
using SamTraining.Core.Interfaces;

namespace SamTraining.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ImagesController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly IFileStorageService _storageService;

        public ImagesController(IUnitOfWork unitOfWork, IFileStorageService storageService)
        {
            _unitOfWork = unitOfWork;
            _storageService = storageService;
        }

        [HttpGet]
        public async Task<ActionResult<PagedResult<DatasetImageResponse>>> GetPaged(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] Guid? categoryId = null,
            [FromQuery] DatasetSplit? split = null,
            [FromQuery] CaptureSource? source = null,
            CancellationToken cancellationToken = default)
        {
            if (page < 1) page = 1;
            if (pageSize < 1 || pageSize > 100) pageSize = 20;

            var (items, totalCount) = await _unitOfWork.DatasetImages.GetPagedAsync(
                page, pageSize, categoryId, split, source, cancellationToken);

            var mapped = items.Select(i => new DatasetImageResponse
            {
                Id = i.Id,
                FileName = i.FileName,
                OriginalFileName = i.OriginalFileName,
                Url = _storageService.GetPublicUrl(i.RelativePath),
                MaskUrl = string.IsNullOrEmpty(i.MaskRelativePath) ? null : _storageService.GetPublicUrl(i.MaskRelativePath),
                FileSizeBytes = i.FileSizeBytes,
                Width = i.Width,
                Height = i.Height,
                CategoryId = i.CategoryId,
                CategoryName = i.Category?.Name ?? "Unassigned",
                CategoryColor = i.Category?.ColorHex ?? "#9CA3AF",
                Split = i.Split,
                Source = i.Source,
                BoundingBoxJson = i.BoundingBoxJson,
                PromptPointsJson = i.PromptPointsJson,
                MetadataJson = i.MetadataJson,
                CreatedAtUtc = i.CreatedAtUtc
            }).ToList();

            return Ok(new PagedResult<DatasetImageResponse>
            {
                Items = mapped,
                TotalCount = totalCount,
                PageIndex = page,
                PageSize = pageSize
            });
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<DatasetImageResponse>> GetById(Guid id, CancellationToken cancellationToken)
        {
            var image = await _unitOfWork.DatasetImages.GetWithCategoryAsync(id, cancellationToken);
            if (image == null) return NotFound();

            return Ok(new DatasetImageResponse
            {
                Id = image.Id,
                FileName = image.FileName,
                OriginalFileName = image.OriginalFileName,
                Url = _storageService.GetPublicUrl(image.RelativePath),
                MaskUrl = string.IsNullOrEmpty(image.MaskRelativePath) ? null : _storageService.GetPublicUrl(image.MaskRelativePath),
                FileSizeBytes = image.FileSizeBytes,
                Width = image.Width,
                Height = image.Height,
                CategoryId = image.CategoryId,
                CategoryName = image.Category?.Name ?? "Unassigned",
                CategoryColor = image.Category?.ColorHex ?? "#9CA3AF",
                Split = image.Split,
                Source = image.Source,
                BoundingBoxJson = image.BoundingBoxJson,
                PromptPointsJson = image.PromptPointsJson,
                MetadataJson = image.MetadataJson,
                CreatedAtUtc = image.CreatedAtUtc
            });
        }

        [HttpGet("stats")]
        public async Task<ActionResult<DatasetOverviewStatsResponse>> GetStats(CancellationToken cancellationToken)
        {
            var categories = await _unitOfWork.Categories.GetWithImageCountsAsync(cancellationToken);
            var splitCounts = await _unitOfWork.DatasetImages.GetCountGroupedBySplitAsync(cancellationToken);
            var totalImages = await _unitOfWork.DatasetImages.CountAsync(cancellationToken: cancellationToken);

            var categoryDistribution = categories.ToDictionary(c => c.Name, c => c.Images.Count);

            int train = splitCounts.GetValueOrDefault(DatasetSplit.Train, 0);
            int val = splitCounts.GetValueOrDefault(DatasetSplit.Validation, 0);
            int test = splitCounts.GetValueOrDefault(DatasetSplit.Test, 0);

            // Compute dataset readiness / health score
            double healthScore = 100.0;
            string recommendedAction = "Dataset is balanced and ready for SAM 3 fine-tuning!";

            if (totalImages < 10)
            {
                healthScore = Math.Min(totalImages * 10.0, 50.0);
                recommendedAction = "Upload at least 15-20 images per category to begin fine-tuning.";
            }
            else if (val == 0)
            {
                healthScore = 70.0;
                recommendedAction = "Split some images into the Validation set for accurate evaluation.";
            }

            return Ok(new DatasetOverviewStatsResponse
            {
                TotalImages = totalImages,
                TotalCategories = categories.Count,
                TrainCount = train,
                ValidationCount = val,
                TestCount = test,
                CategoryDistribution = categoryDistribution,
                HealthScorePercentage = healthScore,
                RecommendedAction = recommendedAction
            });
        }

        [HttpPost("upload")]
        [RequestSizeLimit(50 * 1024 * 1024)] // 50MB
        public async Task<ActionResult<List<DatasetImageResponse>>> Upload(
            [FromForm] List<IFormFile> files,
            [FromForm] Guid categoryId,
            [FromForm] DatasetSplit split = DatasetSplit.Train,
            [FromForm] CaptureSource source = CaptureSource.Web,
            [FromForm] string? boundingBoxJson = null,
            [FromForm] string? promptPointsJson = null,
            [FromForm] string? metadataJson = null,
            CancellationToken cancellationToken = default)
        {
            if (files == null || files.Count == 0)
            {
                return BadRequest(new { message = "No files uploaded." });
            }

            var category = await _unitOfWork.Categories.GetByIdAsync(categoryId, cancellationToken);
            if (category == null)
            {
                return BadRequest(new { message = $"Category with ID {categoryId} does not exist." });
            }

            var results = new List<DatasetImageResponse>();

            foreach (var file in files)
            {
                if (file.Length == 0) continue;

                var relativePath = await _storageService.SaveImageAsync(
                    file.OpenReadStream(), file.FileName, file.ContentType, cancellationToken);

                var datasetImage = new DatasetImage
                {
                    FileName = Path.GetFileName(relativePath),
                    OriginalFileName = file.FileName,
                    ContentType = file.ContentType,
                    FileSizeBytes = file.Length,
                    RelativePath = relativePath,
                    CategoryId = categoryId,
                    Split = split,
                    Source = source,
                    BoundingBoxJson = boundingBoxJson,
                    PromptPointsJson = promptPointsJson,
                    MetadataJson = metadataJson,
                    Width = 800, // Default resolution estimation
                    Height = 600,
                    CreatedAtUtc = DateTime.UtcNow
                };

                await _unitOfWork.DatasetImages.AddAsync(datasetImage, cancellationToken);
                await _unitOfWork.CommitAsync(cancellationToken);

                results.Add(new DatasetImageResponse
                {
                    Id = datasetImage.Id,
                    FileName = datasetImage.FileName,
                    OriginalFileName = datasetImage.OriginalFileName,
                    Url = _storageService.GetPublicUrl(datasetImage.RelativePath),
                    FileSizeBytes = datasetImage.FileSizeBytes,
                    Width = datasetImage.Width,
                    Height = datasetImage.Height,
                    CategoryId = datasetImage.CategoryId,
                    CategoryName = category.Name,
                    CategoryColor = category.ColorHex,
                    Split = datasetImage.Split,
                    Source = datasetImage.Source,
                    BoundingBoxJson = datasetImage.BoundingBoxJson,
                    PromptPointsJson = datasetImage.PromptPointsJson,
                    MetadataJson = datasetImage.MetadataJson,
                    CreatedAtUtc = datasetImage.CreatedAtUtc
                });
            }

            return Ok(results);
        }

        [HttpGet("raw/{**filePath}")]
        public async Task<IActionResult> GetRawImage(string filePath, CancellationToken cancellationToken)
        {
            var stream = await _storageService.GetFileStreamAsync(filePath, cancellationToken);
            if (stream == null)
            {
                return NotFound();
            }

            var ext = Path.GetExtension(filePath).ToLowerInvariant();
            var contentType = ext switch
            {
                ".png" => "image/png",
                ".jpg" or ".jpeg" => "image/jpeg",
                ".webp" => "image/webp",
                _ => "application/octet-stream"
            };

            return File(stream, contentType);
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
        {
            var image = await _unitOfWork.DatasetImages.GetByIdAsync(id, cancellationToken);
            if (image == null) return NotFound();

            await _storageService.DeleteFileAsync(image.RelativePath, cancellationToken);
            if (!string.IsNullOrEmpty(image.MaskRelativePath))
            {
                await _storageService.DeleteFileAsync(image.MaskRelativePath, cancellationToken);
            }

            _unitOfWork.DatasetImages.Remove(image);
            await _unitOfWork.CommitAsync(cancellationToken);

            return NoContent();
        }
    }
}
