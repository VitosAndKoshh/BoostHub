using System.Reflection;
using Adapters.Inbound.Http.Abstractions;
using Microsoft.AspNetCore.Routing;

namespace Adapters.Inbound.Http.Extensions;

public static class EndpointExtensions
{
    public static void MapEndpoints(
        this IEndpointRouteBuilder app,
        Assembly assembly)
    {
        var endpoints = assembly
            .DefinedTypes
            .Where(type =>
                !type.IsAbstract &&
                !type.IsInterface &&
                typeof(IEndpoint).IsAssignableFrom(type));

        foreach (var endpointType in endpoints)
        {
            var endpoint = (IEndpoint)Activator.CreateInstance(endpointType)!;
            endpoint.MapEndpoint(app);
        }
    }
}