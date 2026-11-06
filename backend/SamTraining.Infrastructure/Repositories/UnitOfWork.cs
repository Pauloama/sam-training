using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore.Storage;
using SamTraining.Core.Interfaces;
using SamTraining.Infrastructure.Data;

namespace SamTraining.Infrastructure.Repositories
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly SamTrainingDbContext _context;
        private IDbContextTransaction? _transaction;

        public ICategoryRepository Categories { get; }
        public IDatasetImageRepository DatasetImages { get; }
        public ITrainingJobRepository TrainingJobs { get; }
        public ITrainingMetricRepository TrainingMetrics { get; }
        public IInferencePredictionRepository InferencePredictions { get; }

        public UnitOfWork(
            SamTrainingDbContext context,
            ICategoryRepository categories,
            IDatasetImageRepository datasetImages,
            ITrainingJobRepository trainingJobs,
            ITrainingMetricRepository trainingMetrics,
            IInferencePredictionRepository inferencePredictions)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            Categories = categories;
            DatasetImages = datasetImages;
            TrainingJobs = trainingJobs;
            TrainingMetrics = trainingMetrics;
            InferencePredictions = inferencePredictions;
        }

        public async Task<int> CommitAsync(CancellationToken cancellationToken = default)
        {
            return await _context.SaveChangesAsync(cancellationToken);
        }

        public async Task BeginTransactionAsync(CancellationToken cancellationToken = default)
        {
            _transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        }

        public async Task CommitTransactionAsync(CancellationToken cancellationToken = default)
        {
            try
            {
                await _context.SaveChangesAsync(cancellationToken);
                if (_transaction != null)
                {
                    await _transaction.CommitAsync(cancellationToken);
                }
            }
            finally
            {
                if (_transaction != null)
                {
                    await _transaction.DisposeAsync();
                    _transaction = null;
                }
            }
        }

        public async Task RollbackTransactionAsync(CancellationToken cancellationToken = default)
        {
            if (_transaction != null)
            {
                await _transaction.RollbackAsync(cancellationToken);
                await _transaction.DisposeAsync();
                _transaction = null;
            }
        }

        public void Dispose()
        {
            _transaction?.Dispose();
            _context.Dispose();
            GC.SuppressFinalize(this);
        }
    }
}
