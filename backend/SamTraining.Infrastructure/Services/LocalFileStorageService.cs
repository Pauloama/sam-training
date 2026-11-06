using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using SamTraining.Core.Interfaces;

namespace SamTraining.Infrastructure.Services
{
    public class LocalFileStorageService : IFileStorageService
    {
        private readonly string _storageBasePath;

        public LocalFileStorageService(IConfiguration configuration)
        {
            var basePath = configuration["Storage:BasePath"] ?? Path.Combine(Directory.GetCurrentDirectory(), "storage");
            _storageBasePath = Path.GetFullPath(basePath);

            // Ensure subdirectories exist
            Directory.CreateDirectory(Path.Combine(_storageBasePath, "uploads"));
            Directory.CreateDirectory(Path.Combine(_storageBasePath, "masks"));
            Directory.CreateDirectory(Path.Combine(_storageBasePath, "checkpoints"));
            Directory.CreateDirectory(Path.Combine(_storageBasePath, "exports"));
        }

        public async Task<string> SaveImageAsync(Stream stream, string originalFileName, string contentType, CancellationToken cancellationToken = default)
        {
            var ext = Path.GetExtension(originalFileName);
            if (string.IsNullOrWhiteSpace(ext)) ext = ".jpg";
            
            var uniqueFileName = $"{Guid.NewGuid():N}{ext}";
            var subDir = Path.Combine("uploads", DateTime.UtcNow.ToString("yyyyMMdd"));
            var fullDir = Path.Combine(_storageBasePath, subDir);
            Directory.CreateDirectory(fullDir);

            var fullPath = Path.Combine(fullDir, uniqueFileName);
            using (var fileStream = new FileStream(fullPath, FileMode.Create, FileAccess.Write, FileShare.None, 4096, true))
            {
                await stream.CopyToAsync(fileStream, cancellationToken);
            }

            var relativePath = Path.Combine(subDir, uniqueFileName).Replace('\\', '/');
            return relativePath;
        }

        public async Task<string> SaveMaskAsync(byte[] maskBytes, string baseFileName, CancellationToken cancellationToken = default)
        {
            var uniqueFileName = $"{Path.GetFileNameWithoutExtension(baseFileName)}_mask_{Guid.NewGuid():N}.png";
            var subDir = Path.Combine("masks", DateTime.UtcNow.ToString("yyyyMMdd"));
            var fullDir = Path.Combine(_storageBasePath, subDir);
            Directory.CreateDirectory(fullDir);

            var fullPath = Path.Combine(fullDir, uniqueFileName);
            await File.WriteAllBytesAsync(fullPath, maskBytes, cancellationToken);

            var relativePath = Path.Combine(subDir, uniqueFileName).Replace('\\', '/');
            return relativePath;
        }

        public Task<Stream?> GetFileStreamAsync(string relativePath, CancellationToken cancellationToken = default)
        {
            var fullPath = GetPhysicalPath(relativePath);
            if (!File.Exists(fullPath))
            {
                return Task.FromResult<Stream?>(null);
            }

            Stream stream = new FileStream(fullPath, FileMode.Open, FileAccess.Read, FileShare.Read);
            return Task.FromResult<Stream?>(stream);
        }

        public Task DeleteFileAsync(string relativePath, CancellationToken cancellationToken = default)
        {
            var fullPath = GetPhysicalPath(relativePath);
            if (File.Exists(fullPath))
            {
                File.Delete(fullPath);
            }
            return Task.CompletedTask;
        }

        public string GetPhysicalPath(string relativePath)
        {
            return Path.GetFullPath(Path.Combine(_storageBasePath, relativePath.Replace('/', Path.DirectorySeparatorChar)));
        }

        public string GetPublicUrl(string relativePath)
        {
            var normalized = relativePath.Replace('\\', '/').TrimStart('/');
            return $"/api/images/raw/{normalized}";
        }
    }
}
