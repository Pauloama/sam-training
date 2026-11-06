using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using SamTraining.Core.DTOs;
using SamTraining.Core.Entities;
using SamTraining.Core.Interfaces;

namespace SamTraining.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CategoriesController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;

        public CategoriesController(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        [HttpGet]
        public async Task<ActionResult<IReadOnlyList<CategoryResponse>>> GetAll(CancellationToken cancellationToken)
        {
            var categories = await _unitOfWork.Categories.GetWithImageCountsAsync(cancellationToken);
            var response = categories.Select(c => new CategoryResponse
            {
                Id = c.Id,
                Name = c.Name,
                Code = c.Code,
                Description = c.Description,
                ColorHex = c.ColorHex,
                IconName = c.IconName,
                ImageCount = c.Images.Count,
                CreatedAtUtc = c.CreatedAtUtc
            }).ToList();

            return Ok(response);
        }

        [HttpGet("{id:guid}")]
        public async Task<ActionResult<CategoryResponse>> GetById(Guid id, CancellationToken cancellationToken)
        {
            var category = await _unitOfWork.Categories.GetByIdAsync(id, cancellationToken);
            if (category == null) return NotFound(new { message = $"Category with ID {id} not found." });

            var count = await _unitOfWork.DatasetImages.CountAsync(i => i.CategoryId == id, cancellationToken);

            return Ok(new CategoryResponse
            {
                Id = category.Id,
                Name = category.Name,
                Code = category.Code,
                Description = category.Description,
                ColorHex = category.ColorHex,
                IconName = category.IconName,
                ImageCount = count,
                CreatedAtUtc = category.CreatedAtUtc
            });
        }

        [HttpPost]
        public async Task<ActionResult<CategoryResponse>> Create([FromBody] CreateCategoryRequest request, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return BadRequest(new { message = "Category name is required." });
            }

            var existing = await _unitOfWork.Categories.GetByNameAsync(request.Name, cancellationToken);
            if (existing != null)
            {
                return Conflict(new { message = $"A category with name '{request.Name}' already exists." });
            }

            var category = new Category
            {
                Name = request.Name.Trim(),
                Code = request.Code?.Trim(),
                Description = request.Description?.Trim(),
                ColorHex = string.IsNullOrWhiteSpace(request.ColorHex) ? "#10B981" : request.ColorHex.Trim(),
                IconName = request.IconName ?? "tag",
                CreatedAtUtc = DateTime.UtcNow
            };

            await _unitOfWork.Categories.AddAsync(category, cancellationToken);
            await _unitOfWork.CommitAsync(cancellationToken);

            return CreatedAtAction(nameof(GetById), new { id = category.Id }, new CategoryResponse
            {
                Id = category.Id,
                Name = category.Name,
                Code = category.Code,
                Description = category.Description,
                ColorHex = category.ColorHex,
                IconName = category.IconName,
                ImageCount = 0,
                CreatedAtUtc = category.CreatedAtUtc
            });
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
        {
            var category = await _unitOfWork.Categories.GetByIdAsync(id, cancellationToken);
            if (category == null) return NotFound();

            var hasImages = await _unitOfWork.DatasetImages.AnyAsync(i => i.CategoryId == id, cancellationToken);
            if (hasImages)
            {
                return BadRequest(new { message = "Cannot delete category that contains dataset images. Reassign or delete them first." });
            }

            _unitOfWork.Categories.Remove(category);
            await _unitOfWork.CommitAsync(cancellationToken);

            return NoContent();
        }
    }
}
