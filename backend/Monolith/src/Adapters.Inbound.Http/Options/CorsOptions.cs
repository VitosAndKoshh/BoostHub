namespace Adapters.Inbound.Http.Options;

public sealed record CorsOptions(
    string Name,
    string AllowedHost
);