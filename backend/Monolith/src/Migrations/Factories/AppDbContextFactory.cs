using Adapters.Outbound.Postgres.DbContext;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using Migrations.Constants;

namespace Migrations.Factories;

public sealed class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var configuration = new ConfigurationBuilder()
#if DEBUG
            .AddJsonFile("appsettings.Development.json", optional: true)
#endif
            .AddEnvironmentVariables()
            .Build();
    
        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
        optionsBuilder.UseNpgsql(
            configuration.GetConnectionString(MigrationConfigurations.ConnectionString),
            npgsqlOptions => npgsqlOptions.MigrationsAssembly(typeof(AppDbContextFactory).Assembly.FullName)
        );
    
        return new AppDbContext(optionsBuilder.Options);
    }
}