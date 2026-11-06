using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using SamTraining.Core.Entities;
using SamTraining.Core.Enums;

namespace SamTraining.Core.Interfaces
{
    public interface IDatasetImageRepository : IRepository<DatasetImage>
    {
        Task<(IReadOnlyList<DatasetImage> Items, int TotalCount)> GetPagedAsync(
            int pageIndex, 
            int pageSize, 
            Guid? categoryId = null, 
            DatasetSplit? split = null, 
            CaptureSource? source = null,
            CancellationToken cancellationToken = default);

        Task<IReadOnlyList<DatasetImage>> GetByCategoryIdAsync(Guid categoryId, CancellationToken cancellationToken = default);
        Task<IReadOnlyList<DatasetImage>> GetBySplitAsync(DatasetSplit split, CancellationToken cancellationToken = default);
        Task<Dictionary<Guid, int>> GetCountGroupedByCategoryAsync(CancellationToken cancellationToken = default);
        Task<Dictionary<DatasetSplit, int>> GetCountGroupedBySplitAsync(CancellationToken cancellationToken = default);
        Task<DatasetImage?> GetWithCategoryAsync(Guid id, CancellationToken cancellationToken = default);
    }
}
