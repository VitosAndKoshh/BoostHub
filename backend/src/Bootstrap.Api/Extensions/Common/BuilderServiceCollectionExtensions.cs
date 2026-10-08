using Bootstrap.Api.Extensions.Cors;
using Bootstrap.Api.Extensions.Swagger;

namespace Bootstrap.Api.Extensions.Common;

internal static class BuilderServiceCollectionExtensions
{
    public static IServiceCollection AddApplicationBuilder(
        this IServiceCollection services, IConfiguration configuration)
    {
        services
            //.AddAppCors(configuration)
            .AddSwagger();
        return services;
    }
}