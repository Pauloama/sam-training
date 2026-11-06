using System;
using Microsoft.EntityFrameworkCore;
using SamTraining.Core.Entities;

namespace SamTraining.Infrastructure.Data
{
    public class SamTrainingDbContext : DbContext
    {
        public SamTrainingDbContext(DbContextOptions<SamTrainingDbContext> options) : base(options)
        {
        }

        public DbSet<Category> Categories => Set<Category>();
        public DbSet<DatasetImage> DatasetImages => Set<DatasetImage>();
        public DbSet<TrainingJob> TrainingJobs => Set<TrainingJob>();
        public DbSet<TrainingMetric> TrainingMetrics => Set<TrainingMetric>();
        public DbSet<InferencePrediction> InferencePredictions => Set<InferencePrediction>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Category configuration
            modelBuilder.Entity<Category>(entity =>
            {
                entity.ToTable("categories");
                entity.HasKey(c => c.Id);
                entity.Property(c => c.Name).IsRequired().HasMaxLength(100);
                entity.HasIndex(c => c.Name).IsUnique();
                entity.Property(c => c.Code).HasMaxLength(50);
                entity.Property(c => c.ColorHex).HasMaxLength(20).HasDefaultValue("#10B981");
                entity.Property(c => c.Description).HasMaxLength(500);

                // Seed Default Fintech Categories
                entity.HasData(
                    new Category
                    {
                        Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                        Name = "Credit Card",
                        Code = "FIN-CC-01",
                        Description = "Physical and virtual payment credit/debit cards",
                        ColorHex = "#10B981", // Emerald
                        IconName = "credit-card",
                        CreatedAtUtc = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                    },
                    new Category
                    {
                        Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                        Name = "Identity Document (RG/CNH)",
                        Code = "KYC-ID-02",
                        Description = "Official government identification documents, passports and driver licenses",
                        ColorHex = "#06B6D4", // Cyan
                        IconName = "badge-check",
                        CreatedAtUtc = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                    },
                    new Category
                    {
                        Id = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                        Name = "Fiscal Invoice / Receipt",
                        Code = "FIN-REC-03",
                        Description = "Invoices, retail receipts and fiscal slips for expense auditing",
                        ColorHex = "#6366F1", // Indigo
                        IconName = "receipt",
                        CreatedAtUtc = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                    },
                    new Category
                    {
                        Id = Guid.Parse("44444444-4444-4444-4444-444444444444"),
                        Name = "Banknote / Currency",
                        Code = "FIN-CASH-04",
                        Description = "Physical paper bills and banknotes for counterfeit analysis",
                        ColorHex = "#F59E0B", // Amber
                        IconName = "banknote",
                        CreatedAtUtc = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                    },
                    new Category
                    {
                        Id = Guid.Parse("55555555-5555-5555-5555-555555555555"),
                        Name = "Contract Signature Check",
                        Code = "LEG-SIG-05",
                        Description = "Signed checks and loan/credit contract authorization pages",
                        ColorHex = "#EC4899", // Rose/Pink
                        IconName = "file-signature",
                        CreatedAtUtc = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                    }
                );
            });

            // DatasetImage configuration
            modelBuilder.Entity<DatasetImage>(entity =>
            {
                entity.ToTable("dataset_images");
                entity.HasKey(i => i.Id);
                entity.Property(i => i.FileName).IsRequired().HasMaxLength(255);
                entity.Property(i => i.OriginalFileName).IsRequired().HasMaxLength(255);
                entity.Property(i => i.RelativePath).IsRequired().HasMaxLength(1000);
                entity.Property(i => i.ContentType).HasMaxLength(100);

                entity.HasOne(i => i.Category)
                      .WithMany(c => c.Images)
                      .HasForeignKey(i => i.CategoryId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(i => i.CategoryId);
                entity.HasIndex(i => i.Split);
                entity.HasIndex(i => i.CreatedAtUtc);
            });

            // TrainingJob configuration
            modelBuilder.Entity<TrainingJob>(entity =>
            {
                entity.ToTable("training_jobs");
                entity.HasKey(j => j.Id);
                entity.Property(j => j.JobName).IsRequired().HasMaxLength(200);
                entity.Property(j => j.BaseModel).HasMaxLength(100).HasDefaultValue("SAM-3-ViT-B");
                entity.Property(j => j.Status).HasConversion<int>();
                
                entity.HasMany(j => j.Metrics)
                      .WithOne(m => m.TrainingJob)
                      .HasForeignKey(m => m.TrainingJobId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(j => j.Status);
                entity.HasIndex(j => j.CreatedAtUtc);
            });

            // TrainingMetric configuration
            modelBuilder.Entity<TrainingMetric>(entity =>
            {
                entity.ToTable("training_metrics");
                entity.HasKey(m => m.Id);
                entity.HasIndex(m => new { m.TrainingJobId, m.Epoch, m.Step });
            });

            // InferencePrediction configuration
            modelBuilder.Entity<InferencePrediction>(entity =>
            {
                entity.ToTable("inference_predictions");
                entity.HasKey(p => p.Id);
                entity.Property(p => p.ImageRelativePath).IsRequired().HasMaxLength(1000);
                entity.Property(p => p.PredictedCategoryName).HasMaxLength(100);
                entity.HasOne(p => p.PredictedCategory)
                      .WithMany()
                      .HasForeignKey(p => p.PredictedCategoryId)
                      .OnDelete(DeleteBehavior.SetNull);

                entity.HasIndex(p => p.CreatedAtUtc);
            });
        }
    }
}
