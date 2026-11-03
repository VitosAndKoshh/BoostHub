using Adapters.Inbound.Http.Abstractions;
using Adapters.Inbound.Http.Extensions;
using Adapters.Inbound.Http.Contracts.Responses;
using Core.Application.Results;
using MapsterMapper;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Wolverine;

namespace Core.Features.Booster.Create;

public sealed class CreateEndpoint : IEndpoint
{
    public void MapEndpoint(IEndpointRouteBuilder app)
    {
        app.MapPost("api/v1/booster", async (
            IMapper mapper,
            [FromServices] IMessageBus bus,
            [FromBody] CreateRequest request,
            CancellationToken cancellationToken) =>
        {
            var command = CreateMapping.ToCommand(request);
            var result = await bus.InvokeAsync<Result<CreateResult>>(command, cancellationToken);
            return result.ToResponse<CreateResult, CreateResponse>(mapper);
        })
        .RequireAuthorization()
        .WithTags("Booster")
        .WithName("CreateBooster")
        .WithSummary("Create a booster profile")
        .WithDescription("Creates a booster profile and its initial pending application for the authenticated user.")
        .Produces<CreateResponse>()
        .Produces<ErrorResponse>(StatusCodes.Status400BadRequest)
        .Produces<ErrorResponse>(StatusCodes.Status404NotFound)
        .Produces<ErrorResponse>(StatusCodes.Status409Conflict)
        .Produces<ErrorResponse>(StatusCodes.Status500InternalServerError);
    }
}
