namespace Adapters.Inbound.Http.Contracts.Responses;

internal sealed record ErrorResponse(string Message, string Code);