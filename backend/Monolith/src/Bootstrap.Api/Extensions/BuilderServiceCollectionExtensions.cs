using System.Reflection;
using Adapters.Inbound.Http.DependencyInjection;
using Adapters.Outbound.Postgres.DependencyInjection;
using Adapters.Outbound.Security.DependencyInjection;
using Core.Features.DependencyInjection;
using Core.Application.DependencyInjection;

namespace Bootstrap.Api.Extensions;

internal static class BuilderServiceCollectionExtensions
{
    public static IServiceCollection AddApplicationBuilder(
        this IServiceCollection services,
        IConfiguration configuration,
        Assembly featuresAssembly)
    {
        services
            .AddFeatureServices(featuresAssembly)
            .AddApplication(featuresAssembly)
            .AddSecurity(configuration)
            .AddPostgres(configuration)
            .AddApi(configuration, featuresAssembly);
        return services;
    }
}