using System.Net;
using System.Text.Json;
using Adapters.Inbound.Http.Contracts.Responses;
using Adapters.Inbound.Http.Extensions;
using Core.Domain.Exceptions;
using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace Adapters.Inbound.Http.Middlewares;

public sealed class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(
        RequestDelegate next,
        ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            if (context.Response.HasStarted)
                throw;

            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(
        HttpContext context,
        Exception exception)
    {
        HttpStatusCode statusCode;
        ErrorResponse response;

        if (exception is DomainException domainException)
        {
            var error = domainException.Error;

            statusCode = error.ToStatusCode();

            response = new ErrorResponse(
                Code: error.Code.Value,
                Message: error.Description,
                Errors:
                [
                    new ErrorDetailResponse(
                        Code: error.Code.Value,
                        Message: error.Description)
                ]);
        }
        else if (exception is ValidationException validationException)
        {
            statusCode = HttpStatusCode.BadRequest;

            var errors = validationException.Errors
                .Select(error => new ErrorDetailResponse(
                    Code: error.ErrorCode,
                    Message: error.ErrorMessage,
                    Property: error.PropertyName))
                .ToArray();

            response = new ErrorResponse(
                Code: "validation",
                Message: "One or more validation errors occurred.",
                Errors: errors);
        }
        else
        {
            statusCode = HttpStatusCode.InternalServerError;

#if DEBUG
            var message = exception.Message;
#else
            var message = "An unexpected error occurred.";
#endif

            response = new ErrorResponse(
                Code: "unknown",
                Message: message,
                Errors:
                [
                    new ErrorDetailResponse(
                        Code: "unknown",
                        Message: message)
                ]);
        }

        LogException(exception);

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        await context.Response.WriteAsync(
            JsonSerializer.Serialize(response),
            context.RequestAborted);
    }
    
    private void LogException(Exception exception)
    {
        switch (exception)
        {
            case ValidationException validationException:
                _logger.LogWarning(
                    "Request validation failed. Errors: {Errors}",
                    string.Join(
                        "; ",
                        validationException.Errors.Select(error =>
                            $"{error.PropertyName}: {error.ErrorMessage}")));
                break;

            case DomainException domainException:
                _logger.LogWarning(
                    "Domain operation failed. ErrorCode: {ErrorCode}",
                    domainException.Error.Code.Value);
                break;

            default:
                _logger.LogError(
                    exception,
                    "An unexpected error occurred while processing the request.");
                break;
        }
    }
}