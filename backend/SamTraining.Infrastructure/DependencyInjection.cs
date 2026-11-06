using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SamTraining.Core.Interfaces;
using SamTraining.Infrastructure.Data;
using SamTraining.Infrastructure.Repositories;
using SamTraining.Infrastructure.Services;

namespace SamTraining.Infrastructure
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
        {
            var provider = configuration["DatabaseProvider"] ?? "PostgreSql";
            var connectionString = configuration.GetConnectionString("DefaultConnection") 
                ?? "Host=localhost;Port=5432;Database=sam_training_db;Username=postgres;Password=postgres";

            // Support both PostgreSQL and SQLite (as zero-install local fallback)
            services.AddDbContext<SamTrainingDbContext>(options =>
            {
                if (provider.Equals("Sqlite", StringComparison.OrdinalIgnoreCase) || 
                    connectionString.Contains("Data Source=", StringComparison.OrdinalIgnoreCase))
                {
                    var sqliteConn = connectionString.Contains("Data Source=", StringComparison.OrdinalIgnoreCase) 
                        ? connectionString 
                        : "Data Source=sam_training.db";
                    options.UseSqlite(sqliteConn);
                }
                else
                {
                    options.UseNpgsql(connectionString, b => b.MigrationsAssembly(typeof(SamTrainingDbContext).Assembly.FullName));
                }
            });

            // Repositories
            services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
            services.AddScoped<ICategoryRepository, CategoryRepository>();
            services.AddScoped<IDatasetImageRepository, DatasetImageRepository>();
            services.AddScoped<ITrainingJobRepository, TrainingJobRepository>();
            services.AddScoped<ITrainingMetricRepository, TrainingMetricRepository>();
            services.AddScoped<IInferencePredictionRepository, InferencePredictionRepository>();
            services.AddScoped<IUnitOfWork, UnitOfWork>();

            // Domain Services
            services.AddSingleton<IFileStorageService, LocalFileStorageService>();
            services.AddScoped<IDatasetExportService, DatasetExportService>();
            services.AddScoped<ITrainingCoordinatorService, TrainingCoordinatorService>();
            services.AddScoped<IInferenceService, InferenceService>();

            return services;
        }
    }
}
