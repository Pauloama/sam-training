using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using SamTraining.Core.Entities;

namespace SamTraining.Core.Interfaces
{
    public interface ICategoryRepository : IRepository<Category>
    {
        Task<Category?> GetByNameAsync(string name, CancellationToken cancellationToken = default);
        Task<IReadOnlyList<Category>> GetWithImageCountsAsync(CancellationToken cancellationToken = default);
    }
}
