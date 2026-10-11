using Core.Abstractions.Primitives;

namespace Core.Abstractions.Errors;

public sealed record Error(ErrorCode Code, ErrorType Type, string Description);