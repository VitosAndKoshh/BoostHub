using System.Reflection;
using Adapters.Inbound.Http.Security;
using Core.Application.Ports.Security;
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
        services.AddScoped<IUserContext, HttpUserContext>();
        services.AddRoleAuthorization();
        services.AddEndpointsApiExplorer();
        services.AddMapper(assembly)
            .AddAppCors(configuration)
            .AddSwagger();
        return services;
    }
}
