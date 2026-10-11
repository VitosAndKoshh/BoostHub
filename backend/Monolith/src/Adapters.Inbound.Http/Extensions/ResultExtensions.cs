using System;
using Adapters.Inbound.Http.Contracts.Responses;
using Core.Application.Results;
using MapsterMapper;
using Microsoft.AspNetCore.Mvc;

namespace Adapters.Inbound.Http.Extensions;

internal static class ResultExtensions
{
    public static ActionResult ToResponse(
        this Result from,
        Action? successAction = null)
    {
        if (from.IsFailure)
            return from.ToErrorResponse();
        
        successAction?.Invoke();
        
        return new OkResult();
    }

    public static ActionResult ToResponse<TResult>(
        this Result<TResult> from,
        Action<TResult>? successAction = null)
    {
        if (from.IsFailure)
            return from.ToErrorResponse();

        var value = from.Value!;
        successAction?.Invoke(value);
        
        return new OkResult();
    }
    
    public static ActionResult<TResponse> ToResponse<TResult, TResponse>(
        this Result<TResult> from,
        IMapper mapper,
        Action<TResult>? successAction = null)
    {
        if (from.IsFailure)
            return from.ToErrorResponse();

        var value = from.Value!;
        successAction?.Invoke(value);
        
        return mapper.Map<TResponse>(value);
    }

    private static ActionResult ToErrorResponse(this Result from)
    {
        var error = from.Error!;

        var response = new ErrorResponse(error.Description, error.Code.Value);

        return new ObjectResult(response)
        {
            StatusCode = (int)error.ToStatusCode()
        };
    }
}