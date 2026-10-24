using Core.Abstractions.Primitives;

namespace Core.Domain.Errors.BoostRequest;

public sealed class BoostRequestCodes
{
    public static readonly ErrorCode InvalidCustomerId = new("boost-request.invalid-customer-id");
    public static readonly ErrorCode InvalidGameId = new("boost-request.invalid-game-id");
    public static readonly ErrorCode InvalidPrice = new("boost-request.invalid-price");
    public static readonly ErrorCode InvalidDescription = new("boost-request.invalid-description");
    public static readonly ErrorCode InvalidMaxCompletionDuration = new("boost-request.invalid-max-completion-duration");
    public static readonly ErrorCode RequestAlreadyClosed = new("boost-request.already-closed");
    public static readonly ErrorCode RequestAlreadyCancelled = new("boost-request.already-cancelled");
}
