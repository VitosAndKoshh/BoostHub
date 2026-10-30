using Adapters.Inbound.Http.Abstractions;
using Adapters.Inbound.Http.Contracts.Responses;
using Adapters.Inbound.Http.Extensions;
using Core.Application.Results;
using MapsterMapper;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Wolverine;

namespace Core.Features.Auth.Login;

public sealed class LoginEndpoint : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("api/v1/auth/login", async (
            IMapper mapper,
            [FromServices] IMessageBus bus,
            [FromBody] LoginRequest request,
            CancellationToken cancellationToken) =>
        {
            var command = new LoginCommand(request.Email, request.Password);
            var result = await bus.InvokeAsync<Result<LoginResult>>(command, cancellationToken);
            return result.ToResponse<LoginResult, LoginResponse>(mapper);
        })
        .WithTags("Auth")
        .WithName("Login")
        .WithSummary("Login user")
        .WithDescription(
            "Authenticates a user using an email address and password. " +
            "Returns an access token when authentication succeeds.")
        .Produces<LoginResponse>()
        .Produces<ErrorResponse>(StatusCodes.Status400BadRequest)
        .Produces<ErrorResponse>(StatusCodes.Status500InternalServerError);
    }
}