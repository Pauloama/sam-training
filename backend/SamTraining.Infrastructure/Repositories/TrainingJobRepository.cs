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
    public class TrainingJobRepository : Repository<TrainingJob>, ITrainingJobRepository
    {
        public TrainingJobRepository(SamTrainingDbContext context) : base(context)
        {
        }

        public async Task<TrainingJob?> GetWithMetricsAsync(Guid id, CancellationToken cancellationToken = default)
        {
            return await _dbSet
                .Include(j => j.Metrics.OrderBy(m => m.Epoch).ThenBy(m => m.Step))
                .FirstOrDefaultAsync(j => j.Id == id, cancellationToken);
        }

        public async Task<IReadOnlyList<TrainingJob>> GetRecentJobsAsync(int limit = 10, CancellationToken cancellationToken = default)
        {
            return await _dbSet
                .Include(j => j.Metrics)
                .AsNoTracking()
                .OrderByDescending(j => j.CreatedAtUtc)
                .Take(limit)
                .ToListAsync(cancellationToken);
        }

        public async Task<TrainingJob?> GetNextQueuedJobAsync(CancellationToken cancellationToken = default)
        {
            return await _dbSet
                .Where(j => j.Status == TrainingJobStatus.Queued)
                .OrderBy(j => j.CreatedAtUtc)
                .FirstOrDefaultAsync(cancellationToken);
        }

        public async Task<TrainingJob?> GetLatestCompletedWithCheckpointAsync(CancellationToken cancellationToken = default)
        {
            return await _dbSet
                .Where(j => j.Status == TrainingJobStatus.Completed && !string.IsNullOrEmpty(j.CheckpointRelativePath))
                .OrderByDescending(j => j.CompletedAtUtc)
                .FirstOrDefaultAsync(cancellationToken);
        }
    }
}
