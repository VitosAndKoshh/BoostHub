using System.Reflection;
using Microsoft.Extensions.DependencyInjection;

namespace Adapters.Outbound.Postgres.DependencyInjection;

internal static class RepositoryServiceCollectionExtensions
{
    public static IServiceCollection AddRepositories(
        this IServiceCollection services)
    {
        var assembly = typeof(RepositoryServiceCollectionExtensions).Assembly;
        var repositoryTypes = assembly
            .DefinedTypes
            .Where(type =>
                type is { IsClass: true, IsAbstract: false } &&
                type.Name.EndsWith("Repository", StringComparison.Ordinal));

        foreach (var repositoryType in repositoryTypes)
        {
            var implementationType = repositoryType.AsType();

            var interfaces = repositoryType
                .GetInterfaces()
                .Where(type =>
                    type.Name.EndsWith("Repository", StringComparison.Ordinal));

            foreach (var serviceType in interfaces)
            {
                services.AddScoped(serviceType, implementationType);
            }
        }

        return services;
    }
}