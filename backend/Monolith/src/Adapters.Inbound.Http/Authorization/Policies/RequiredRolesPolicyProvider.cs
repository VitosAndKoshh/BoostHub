using Core.Domain.Enums;
using Adapters.Inbound.Http.Authorization.Requirements;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;

namespace Adapters.Inbound.Http.Authorization.Policies;

internal sealed class RequiredRolesPolicyProvider : IAuthorizationPolicyProvider
{
    private const string PolicyPrefix = "BoostHub.RequiredRoles:";
    private readonly DefaultAuthorizationPolicyProvider _fallbackProvider;

    public RequiredRolesPolicyProvider(IOptions<AuthorizationOptions> options)
    {
        _fallbackProvider = new DefaultAuthorizationPolicyProvider(options);
    }

    public Task<AuthorizationPolicy?> GetPolicyAsync(string policyName)
    {
        if (!policyName.StartsWith(PolicyPrefix, StringComparison.Ordinal))
            return _fallbackProvider.GetPolicyAsync(policyName);

        var roles = policyName[PolicyPrefix.Length..]
            .Split(',', StringSplitOptions.RemoveEmptyEntries)
            .Select(value => Enum.TryParse<AccountRole>(value, out var role)
                ? (AccountRole?)role
                : null)
            .ToArray();

        if (roles.Length == 0 || roles.Any(role => role is null || !Enum.IsDefined(role.Value)))
            return Task.FromResult<AuthorizationPolicy?>(null);

        var policy = new AuthorizationPolicyBuilder()
            .AddAuthenticationSchemes(JwtBearerDefaults.AuthenticationScheme)
            .RequireAuthenticatedUser()
            .AddRequirements(new RequiredRolesRequirement(roles.OfType<AccountRole>()));

        return Task.FromResult<AuthorizationPolicy?>(policy.Build());
    }

    public Task<AuthorizationPolicy> GetDefaultPolicyAsync()
        => _fallbackProvider.GetDefaultPolicyAsync();

    public Task<AuthorizationPolicy?> GetFallbackPolicyAsync()
        => _fallbackProvider.GetFallbackPolicyAsync();

    public static string CreatePolicyName(IEnumerable<AccountRole> roles)
        => PolicyPrefix + string.Join(",", roles.Distinct().OrderBy(role => role).Select(role => role.ToString()));
}
