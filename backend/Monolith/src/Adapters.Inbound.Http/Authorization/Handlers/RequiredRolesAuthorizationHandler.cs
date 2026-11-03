using Adapters.Inbound.Http.Authorization.Requirements;
using Core.Application.Ports.Persistence.Repositories;
using Core.Application.Ports.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace Adapters.Inbound.Http.Authorization.Handlers;

public sealed class RequiredRolesAuthorizationHandler : AuthorizationHandler<RequiredRolesRequirement>
{
    private readonly IRoleRepository _roleRepository;
    private readonly IUserContext _userContext;
    private readonly ILogger<RequiredRolesAuthorizationHandler> _logger;

    public RequiredRolesAuthorizationHandler(
        IRoleRepository roleRepository,
        IUserContext userContext,
        ILogger<RequiredRolesAuthorizationHandler> logger)
    {
        _roleRepository = roleRepository;
        _userContext = userContext;
        _logger = logger;
    }

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        RequiredRolesRequirement requirement)
    {
        if (!_userContext.IsAuthenticated)
            return;

        var userId = _userContext.UserId;
        if (!userId.HasValue)
        {
            _logger.LogWarning("Role authorization denied because the authenticated user id claim is invalid");
            return;
        }

        var cancellationToken = (context.Resource as HttpContext)?.RequestAborted ?? CancellationToken.None;
        var userRoles = await _roleRepository.GetByUserIdAsync(userId.Value, cancellationToken);

        if (requirement.Roles.Any(userRoles.Contains))
        {
            context.Succeed(requirement);
            return;
        }

        _logger.LogInformation(
            "Role authorization denied for UserId {UserId}. RequiredRoles: {RequiredRoles}",
            userId.Value,
            string.Join(",", requirement.Roles));
    }
}
