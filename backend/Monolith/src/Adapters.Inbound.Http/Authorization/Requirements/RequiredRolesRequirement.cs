using Core.Domain.Enums;
using Microsoft.AspNetCore.Authorization;

namespace Adapters.Inbound.Http.Authorization.Requirements;

public sealed class RequiredRolesRequirement : IAuthorizationRequirement
{
    public RequiredRolesRequirement(IEnumerable<AccountRole> roles)
    {
        var configuredRoles = roles
            .Distinct()
            .ToArray();

        if (configuredRoles.Length == 0 || configuredRoles.Any(role => !Enum.IsDefined(role)))
            throw new ArgumentException("At least one valid role is required.", nameof(roles));

        Roles = configuredRoles;
    }

    public IReadOnlyCollection<AccountRole> Roles { get; }
}
