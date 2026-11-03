using Adapters.Inbound.Http.Authorization.Handlers;
using Adapters.Inbound.Http.Authorization.Policies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.DependencyInjection;

namespace Adapters.Inbound.Http.DependencyInjection;

internal static class AuthorizationServiceCollectionExtensions
{
    public static IServiceCollection AddRoleAuthorization(this IServiceCollection services)
    {
        services.AddAuthorization();
        services.AddSingleton<IAuthorizationPolicyProvider, RequiredRolesPolicyProvider>();
        services.AddScoped<IAuthorizationHandler, RequiredRolesAuthorizationHandler>();
        return services;
    }
}
