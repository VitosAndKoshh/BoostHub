using Adapters.Outbound.Postgres.Constants;
using Adapters.Outbound.Postgres.DbContext;
using Adapters.Outbound.Postgres.Seeder;
using Adapters.Outbound.Postgres.UnitOfWork;
using Core.Application.Ports.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Adapters.Outbound.Postgres.DependencyInjection;

public static class PostgresServiceCollectionExtensions
{
    public static IServiceCollection AddPostgres(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString(ConfigurationConstants.ConnectionString),
                npgsqlOptions =>
                {
                    npgsqlOptions.EnableRetryOnFailure(
                        maxRetryCount: 5,
                        maxRetryDelay: TimeSpan.FromSeconds(10),
                        errorCodesToAdd: null);
                }));
    
        services.AddScoped<DbSeeder>();
        services.AddScoped<IUnitOfWork, UnitOfWorkBase>();
        services.AddRepositories();
        return services;
    }
}