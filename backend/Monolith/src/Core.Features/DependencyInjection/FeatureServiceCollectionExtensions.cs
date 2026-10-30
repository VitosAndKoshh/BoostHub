using System.Reflection;
using Microsoft.Extensions.DependencyInjection;

namespace Core.Features.DependencyInjection;

public static class FeatureServiceCollectionExtensions
{
    public static IServiceCollection AddFeatureServices(
        this IServiceCollection services,
        Assembly assembly)
    {
        var serviceTypes = assembly
            .DefinedTypes
            .Where(type =>
                type is { IsAbstract: false, IsInterface: false } &&
                type.Name.EndsWith("Service", StringComparison.Ordinal) &&
                type.IsClass);

        foreach (var serviceType in serviceTypes)
        {
            services.AddScoped(serviceType.AsType());
        }

        return services;
    }
}