using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SamTraining.Core.Entities;
using SamTraining.Core.Enums;
using SamTraining.Core.Interfaces;
using SamTraining.Infrastructure.Data;

namespace SamTraining.Infrastructure.Repositories
{
    public class DatasetImageRepository : Repository<DatasetImage>, IDatasetImageRepository
    {
        public DatasetImageRepository(SamTrainingDbContext context) : base(context)
        {
        }

        public async Task<(IReadOnlyList<DatasetImage> Items, int TotalCount)> GetPagedAsync(
            int pageIndex, 
            int pageSize, 
            Guid? categoryId = null, 
            DatasetSplit? split = null, 
            CaptureSource? source = null,
            CancellationToken cancellationToken = default)
        {
            var query = _dbSet.Include(i => i.Category).AsNoTracking().AsQueryable();

            if (categoryId.HasValue)
            {
                query = query.Where(i => i.CategoryId == categoryId.Value);
            }

            if (split.HasValue)
            {
                query = query.Where(i => i.Split == split.Value);
            }

            if (source.HasValue)
            {
                query = query.Where(i => i.Source == source.Value);
            }

            var total = await query.CountAsync(cancellationToken);

            var items = await query
                .OrderByDescending(i => i.CreatedAtUtc)
                .Skip((pageIndex - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(cancellationToken);

            return (items, total);
        }

        public async Task<IReadOnlyList<DatasetImage>> GetByCategoryIdAsync(Guid categoryId, CancellationToken cancellationToken = default)
        {
            return await _dbSet
                .Where(i => i.CategoryId == categoryId)
                .AsNoTracking()
                .OrderByDescending(i => i.CreatedAtUtc)
                .ToListAsync(cancellationToken);
        }

        public async Task<IReadOnlyList<DatasetImage>> GetBySplitAsync(DatasetSplit split, CancellationToken cancellationToken = default)
        {
            return await _dbSet
                .Include(i => i.Category)
                .Where(i => i.Split == split)
                .AsNoTracking()
                .ToListAsync(cancellationToken);
        }

        public async Task<Dictionary<Guid, int>> GetCountGroupedByCategoryAsync(CancellationToken cancellationToken = default)
        {
            return await _dbSet
                .GroupBy(i => i.CategoryId)
                .Select(g => new { CategoryId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.CategoryId, x => x.Count, cancellationToken);
        }

        public async Task<Dictionary<DatasetSplit, int>> GetCountGroupedBySplitAsync(CancellationToken cancellationToken = default)
        {
            return await _dbSet
                .GroupBy(i => i.Split)
                .Select(g => new { Split = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.Split, x => x.Count, cancellationToken);
        }

        public async Task<DatasetImage?> GetWithCategoryAsync(Guid id, CancellationToken cancellationToken = default)
        {
            return await _dbSet
                .Include(i => i.Category)
                .FirstOrDefaultAsync(i => i.Id == id, cancellationToken);
        }
    }
}
