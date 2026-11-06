using System;
using System.Threading;
using System.Threading.Tasks;

namespace SamTraining.Core.Interfaces
{
    public interface IUnitOfWork : IDisposable
    {
        ICategoryRepository Categories { get; }
        IDatasetImageRepository DatasetImages { get; }
        ITrainingJobRepository TrainingJobs { get; }
        ITrainingMetricRepository TrainingMetrics { get; }
        IInferencePredictionRepository InferencePredictions { get; }

        Task<int> CommitAsync(CancellationToken cancellationToken = default);
        Task BeginTransactionAsync(CancellationToken cancellationToken = default);
        Task CommitTransactionAsync(CancellationToken cancellationToken = default);
        Task RollbackTransactionAsync(CancellationToken cancellationToken = default);
    }
}
