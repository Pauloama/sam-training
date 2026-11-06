using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SamTraining.Core.Entities;
using SamTraining.Core.Interfaces;
using SamTraining.Infrastructure.Data;

namespace SamTraining.Infrastructure.Repositories
{
    public class TrainingMetricRepository : Repository<TrainingMetric>, ITrainingMetricRepository
    {
        public TrainingMetricRepository(SamTrainingDbContext context) : base(context)
        {
        }

        public async Task<IReadOnlyList<TrainingMetric>> GetByJobIdAsync(Guid jobId, CancellationToken cancellationToken = default)
        {
            return await _dbSet
                .Where(m => m.TrainingJobId == jobId)
                .OrderBy(m => m.Epoch)
                .ThenBy(m => m.Step)
                .AsNoTracking()
                .ToListAsync(cancellationToken);
        }
    }

    public class InferencePredictionRepository : Repository<InferencePrediction>, IInferencePredictionRepository
    {
        public InferencePredictionRepository(SamTrainingDbContext context) : base(context)
        {
        }

        public async Task<IReadOnlyList<InferencePrediction>> GetRecentPredictionsAsync(int limit = 20, CancellationToken cancellationToken = default)
        {
            return await _dbSet
                .Include(p => p.PredictedCategory)
                .OrderByDescending(p => p.CreatedAtUtc)
                .Take(limit)
                .AsNoTracking()
                .ToListAsync(cancellationToken);
        }
    }
}
