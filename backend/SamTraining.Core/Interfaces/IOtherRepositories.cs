using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using SamTraining.Core.Entities;

namespace SamTraining.Core.Interfaces
{
    public interface ITrainingMetricRepository : IRepository<TrainingMetric>
    {
        Task<IReadOnlyList<TrainingMetric>> GetByJobIdAsync(Guid jobId, CancellationToken cancellationToken = default);
    }

    public interface IInferencePredictionRepository : IRepository<InferencePrediction>
    {
        Task<IReadOnlyList<InferencePrediction>> GetRecentPredictionsAsync(int limit = 20, CancellationToken cancellationToken = default);
    }
}
