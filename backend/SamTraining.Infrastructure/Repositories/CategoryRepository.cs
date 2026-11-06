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
    public class CategoryRepository : Repository<Category>, ICategoryRepository
    {
        public CategoryRepository(SamTrainingDbContext context) : base(context)
        {
        }

        public async Task<Category?> GetByNameAsync(string name, CancellationToken cancellationToken = default)
        {
            return await _dbSet
                .FirstOrDefaultAsync(c => c.Name.ToLower() == name.Trim().ToLower(), cancellationToken);
        }

        public async Task<IReadOnlyList<Category>> GetWithImageCountsAsync(CancellationToken cancellationToken = default)
        {
            return await _dbSet
                .Include(c => c.Images)
                .AsNoTracking()
                .OrderBy(c => c.Name)
                .ToListAsync(cancellationToken);
        }
    }
}
