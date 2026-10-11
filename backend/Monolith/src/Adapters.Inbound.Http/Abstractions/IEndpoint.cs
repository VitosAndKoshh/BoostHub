using Microsoft.AspNetCore.Routing;

namespace Adapters.Inbound.Http.Abstractions;

public interface IEndpoint
{
    void MapEndpoint(IEndpointRouteBuilder app);
}