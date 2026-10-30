using System.Reflection;
using Mapster;
using MapsterMapper;
using Microsoft.Extensions.DependencyInjection;

namespace Adapters.Inbound.Http.DependencyInjection;

internal static class MapperServiceCollectionExtensions
{
    public static IServiceCollection AddMapper(this IServiceCollection services, Assembly assembly)
    {
        var config = new TypeAdapterConfig();
        config.Scan(assembly);

        services.AddSingleton(config);
        services.AddScoped<IMapper, ServiceMapper>();

        return services;
    }
}