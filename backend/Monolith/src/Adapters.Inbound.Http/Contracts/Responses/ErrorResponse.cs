namespace Adapters.Inbound.Http.Contracts.Responses;

public sealed record ErrorResponse(
    string Code,
    string Message,
    IReadOnlyList<ErrorDetailResponse> Errors);

public sealed record ErrorDetailResponse(
    string Code,
    string Message,
    string? Property = null);