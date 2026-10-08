namespace Bootstrap.Api.Options;

internal sealed record CorsOptions(
    string Name,
    string AllowedHost
);