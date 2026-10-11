using System;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;
using Adapters.Inbound.Http.Extensions;
using Adapters.Inbound.Http.Contracts.Responses;
using Core.Domain.Exceptions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace Adapters.Inbound.Http.Middlewares;

public sealed class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task Invoke(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await ExceptionMiddlewareHandler(context, ex);
        }
    }

    private async Task ExceptionMiddlewareHandler(HttpContext context, Exception exception)
    {
        HttpStatusCode statusCode;
        string errorCode = "UNKNOWN_ERROR";
        string message;

        if (exception is DomainException domainException)
        {
            errorCode = domainException.Error.Code.Value;
            statusCode = domainException.Error.ToStatusCode();
            message = domainException.Error.Description;
        }
        else
        {
            statusCode = HttpStatusCode.InternalServerError;
#if DEBUG
            message = exception.Message;
#else
            message = "An unexpected error occurred.";
#endif
        }

        var result = JsonSerializer.Serialize(new ErrorResponse(
            Message: message,
            Code: errorCode
        ));

        _logger.LogError(exception, "An error occurred: {Message}", message);
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;
        await context.Response.WriteAsync(result);
    }
}