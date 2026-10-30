using Adapters.Inbound.Http.Abstractions;
using Adapters.Inbound.Http.Extensions;
using Adapters.Inbound.Http.Contracts.Responses;
using Core.Application.Results;
using MapsterMapper;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.Mvc;
using Wolverine;

namespace Core.Features.Auth.Register;

public sealed class RegisterEndpoint : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("api/v1/auth/register", async (
            IMapper mapper,
            [FromServices] IMessageBus bus,
            [FromBody] RegisterRequest request,
            CancellationToken cancellationToken) =>
        {
            var command = new RegisterCommand(request.Email, request.Password);
            var result = await bus.InvokeAsync<Result<RegisterResult>>(command, cancellationToken);
            return result.ToResponse<RegisterResult, RegisterResponse>(mapper);
        })
        .WithTags("Auth")
        .WithName("Register")
        .WithSummary("Register a new user")
        .WithDescription(
            "Creates a new user account using an email address and password. " +
            "Returns an access token when registration succeeds.")
        .Produces<RegisterResponse>()
        .Produces<ErrorResponse>(StatusCodes.Status400BadRequest)
        .Produces<ErrorResponse>(StatusCodes.Status409Conflict)
        .Produces<ErrorResponse>(StatusCodes.Status500InternalServerError);
    }
}