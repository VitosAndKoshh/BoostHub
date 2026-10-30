using Adapters.Inbound.Http.Contracts.Responses;
using Core.Application.Results;
using MapsterMapper;
using Microsoft.AspNetCore.Http;

namespace Adapters.Inbound.Http.Extensions;

public static class ResultExtensions
{
    public static IResult ToResponse(
        this Result result,
        Action? successAction = null)
    {
        if (result.IsFailure)
            return result.ToErrorResponse();
        
        successAction?.Invoke();
        
        return Results.Ok();
    }

    public static IResult ToResponse<TResult>(
        this Result<TResult> result,
        Action<TResult>? successAction = null)
    {
        if (result.IsFailure)
            return result.ToErrorResponse();

        var value = result.Value!;
        successAction?.Invoke(value);
        
        return Results.Ok();
    }
    
    public static IResult ToResponse<TResult, TResponse>(
        this Result<TResult> result,
        IMapper mapper,
        Action<TResult>? successAction = null)
    {
        if (result.IsFailure)
            return result.ToErrorResponse();

        var value = result.Value!;
        successAction?.Invoke(value);
        
        var response = mapper.Map<TResponse>(value);
        return Results.Ok(response);
    }

    private static IResult ToErrorResponse(this Result result)
    {
        var error = result.Error!;

        var response = new ErrorResponse(
            Code: error.Code.Value,
            Message: error.Description,
            Errors:
            [
                new ErrorDetailResponse(
                    Code: error.Code.Value,
                    Message: error.Description)
            ]);

        return Results.Json(
            response,
            statusCode: (int)error.ToStatusCode());
    }
}