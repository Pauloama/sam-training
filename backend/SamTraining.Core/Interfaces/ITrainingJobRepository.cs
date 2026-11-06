using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using SamTraining.Core.Entities;
using SamTraining.Core.Enums;

namespace SamTraining.Core.Interfaces
{
    public interface ITrainingJobRepository : IRepository<TrainingJob>
    {
        Task<TrainingJob?> GetWithMetricsAsync(Guid id, CancellationToken cancellationToken = default);
        Task<IReadOnlyList<TrainingJob>> GetRecentJobsAsync(int limit = 10, CancellationToken cancellationToken = default);
        Task<TrainingJob?> GetNextQueuedJobAsync(CancellationToken cancellationToken = default);
        Task<TrainingJob?> GetLatestCompletedWithCheckpointAsync(CancellationToken cancellationToken = default);
    }
}
