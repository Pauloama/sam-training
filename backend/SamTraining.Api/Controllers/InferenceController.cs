using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using SamTraining.Core.Entities;
using SamTraining.Core.Interfaces;

namespace SamTraining.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class InferenceController : ControllerBase
    {
        private readonly IInferenceService _inferenceService;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IFileStorageService _storageService;

        public InferenceController(
            IInferenceService inferenceService,
            IUnitOfWork unitOfWork,
            IFileStorageService storageService)
        {
            _inferenceService = inferenceService;
            _unitOfWork = unitOfWork;
            _storageService = storageService;
        }

        [HttpPost("predict")]
        public async Task<ActionResult<InferenceResultDto>> Predict(
            IFormFile file,
            [FromForm] string? promptJson = null,
            [FromForm] Guid? checkpointJobId = null,
            CancellationToken cancellationToken = default)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "An image file is required for SAM 3 inference." });
            }

            using var stream = file.OpenReadStream();
            var result = await _inferenceService.ClassifyAndSegmentAsync(
                stream, file.FileName, promptJson, checkpointJobId, cancellationToken);

            return Ok(result);
        }

        [HttpGet("history")]
        public async Task<ActionResult> GetHistory([FromQuery] int limit = 20, CancellationToken cancellationToken = default)
        {
            var predictions = await _unitOfWork.InferencePredictions.GetRecentPredictionsAsync(limit, cancellationToken);

            var response = predictions.Select(p => new
            {
                id = p.Id,
                imageUrl = _storageService.GetPublicUrl(p.ImageRelativePath),
                maskUrl = string.IsNullOrEmpty(p.MaskRelativePath) ? null : _storageService.GetPublicUrl(p.MaskRelativePath),
                predictedCategoryName = p.PredictedCategoryName,
                predictedCategoryColor = p.PredictedCategory?.ColorHex ?? "#10B981",
                confidenceScore = p.ConfidenceScore,
                inferenceTimeMs = p.InferenceTimeMs,
                modelVersion = p.ModelVersion,
                promptUsedJson = p.PromptUsedJson,
                createdAtUtc = p.CreatedAtUtc
            });

            return Ok(response);
        }
    }
}
