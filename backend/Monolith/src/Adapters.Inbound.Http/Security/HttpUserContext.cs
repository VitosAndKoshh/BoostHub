using System.Security.Claims;
using Core.Application;
using Core.Application.Ports.Security;
using Microsoft.AspNetCore.Http;

namespace Adapters.Inbound.Http.Security;

internal sealed class HttpUserContext : IUserContext
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public HttpUserContext(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public bool IsAuthenticated =>
        _httpContextAccessor.HttpContext?.User.Identity?.IsAuthenticated == true;

    public Guid? UserId
    {
        get
        {
            if (!IsAuthenticated)
                return null;

            var subject = _httpContextAccessor.HttpContext?.User.FindFirstValue(JwtClaims.Subject);
            return Guid.TryParse(subject, out var userId) && userId != Guid.Empty
                ? userId
                : null;
        }
    }
}
