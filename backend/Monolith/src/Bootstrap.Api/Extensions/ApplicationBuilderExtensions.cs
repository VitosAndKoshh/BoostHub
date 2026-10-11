using System.Reflection;
using Adapters.Inbound.Http.Extensions;
using Adapters.Inbound.Http.Middlewares;

namespace Bootstrap.Api.Extensions;

internal static class ApplicationBuilderExtensions
{
    public static void Configure(this WebApplication app, Assembly featuresAssembly)
    {
        app.UseSwagger();
        app.UseSwaggerUI(options =>
        {
            options.SwaggerEndpoint("/swagger/v1/swagger.json", "BoostHub API");
            options.RoutePrefix = string.Empty;
            options.ConfigObject.AdditionalItems["persistAuthorization"] = true;
        });
        
        app.UseMiddleware<ExceptionHandlingMiddleware>();

        app.UseCors();

        app.UseAuthentication();

        app.UseAuthorization();

        app.MapEndpoints(featuresAssembly);
    }
}