using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using SamTraining.Infrastructure;
using SamTraining.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

// 1. Add Infrastructure Services (PostgreSQL DbContext, Repositories, Domain Services)
builder.Services.AddInfrastructure(builder.Configuration);

// 2. Add Controllers with JSON serialization settings
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

// 3. Add CORS for React Web and React Native Mobile
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// 4. Swagger / OpenAPI Configuration
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// 5. Automatic Migration & Seed on Startup
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    try
    {
        var db = services.GetRequiredService<SamTrainingDbContext>();
        await db.Database.EnsureCreatedAsync();
        logger.LogInformation("Database initialized and verified successfully.");
    }
    catch (Exception ex)
    {
        logger.LogWarning(ex, "Could not automatically connect or initialize Postgres on startup. Ensure Postgres is running.");
    }
}

// 6. HTTP Pipeline
app.UseCors("AllowAll");

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "SAM 3 Fine-Tuning API v1");
    c.RoutePrefix = "swagger";
});

app.UseAuthorization();
app.MapControllers();

app.Run();
