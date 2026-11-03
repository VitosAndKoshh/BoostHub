using Adapters.Inbound.Http.Authorization.Policies;
using Adapters.Inbound.Http.Authorization.Requirements;
using Core.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Builder;

namespace Adapters.Inbound.Http.Authorization;

public static class AuthorizationEndpointExtensions
{
    public static IEndpointConventionBuilder RequireRoles(
        this IEndpointConventionBuilder endpoint,
        params AccountRole[] roles)
    {
        ArgumentNullException.ThrowIfNull(endpoint);

        var policyName = RequiredRolesPolicyProvider.CreatePolicyName(
            new RequiredRolesRequirement(roles).Roles);

        return endpoint.RequireAuthorization(new AuthorizeAttribute { Policy = policyName });
    }
}
