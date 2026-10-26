using System.Reflection;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Adapters.Inbound.Http.DependencyInjection;

public static class ApiServiceCollectionExtensions
{
    public static IServiceCollection AddApi(
        this IServiceCollection services,
        IConfiguration configuration,
        Assembly assembly)
    {
        services.AddHttpContextAccessor();
        services.AddAuthentication();
        services.AddAuthorization();
        services.AddMapper(assembly)
            .AddAppCors(configuration)
            .AddSwagger();
        return services;
    }
}