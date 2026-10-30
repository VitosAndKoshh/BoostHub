using Adapters.Outbound.Postgres.Seeder;

namespace Bootstrap.Api.Extensions;

public static class SeedingApplicationBuilderExtensions
{
    public static async Task SeedDbAsync(this IApplicationBuilder app)
    {
        await using var scope = app.ApplicationServices.CreateAsyncScope();

        var seeder = scope.ServiceProvider.GetRequiredService<DbSeeder>();

        await seeder.SeedAsync(app.ApplicationServices
            .GetRequiredService<IHostApplicationLifetime>()
            .ApplicationStopping);
    }
}