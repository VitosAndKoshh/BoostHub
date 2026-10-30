using System.Reflection;
using Adapters.Inbound.Http.Extensions;
using Adapters.Inbound.Http.Middlewares;

namespace Bootstrap.Api.Extensions;

internal static class ApplicationBuilderExtensions
{
    public static async Task Configure(this WebApplication app, Assembly featuresAssembly)
    {
        app.UseSwagger();
        app.UseSwaggerUI(options =>
        {
            options.SwaggerEndpoint("/swagger/v1/swagger.json", "BoostHub API");
            options.RoutePrefix = string.Empty;
            options.ConfigObject.AdditionalItems["persistAuthorization"] = true;
        });
        
        app.UseMiddleware<ExceptionHandlingMiddleware>();

        await app.SeedDbAsync();

        app.Logger.LogInformation("Database seeding completed.");

        app.UseCors();
        app.UseAuthentication();
        app.UseAuthorization();

        app.MapEndpoints(featuresAssembly);

        app.Logger.LogInformation(
            "Features assembly: {Assembly}",
            featuresAssembly.FullName);
    }
}