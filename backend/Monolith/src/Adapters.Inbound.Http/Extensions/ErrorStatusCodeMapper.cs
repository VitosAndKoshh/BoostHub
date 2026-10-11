using System.Net;
using Core.Abstractions.Errors;

namespace Adapters.Inbound.Http.Extensions;

internal static class ErrorStatusCodeMapper
{
    public static HttpStatusCode ToStatusCode(this Error error)
    {
        return error.Type switch
        {
            ErrorType.Validation => HttpStatusCode.BadRequest,
            ErrorType.Unauthorized => HttpStatusCode.Unauthorized,
            ErrorType.Forbidden => HttpStatusCode.Forbidden,
            ErrorType.NotFound => HttpStatusCode.NotFound,
            ErrorType.Conflict => HttpStatusCode.Conflict,
            ErrorType.InternalServerError => HttpStatusCode.InternalServerError,
            _ => HttpStatusCode.InternalServerError
        };
    }
}