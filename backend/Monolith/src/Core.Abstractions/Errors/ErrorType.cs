namespace Core.Abstractions.Errors;

public enum ErrorType
{
    NotFound,
    Conflict,
    Validation,
    Unauthorized,
    Forbidden,
    InternalServerError
}