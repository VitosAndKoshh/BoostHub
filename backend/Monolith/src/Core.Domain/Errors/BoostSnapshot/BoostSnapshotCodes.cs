using Core.Abstractions.Primitives;

namespace Core.Domain.Errors.BoostSnapshot;

public sealed class BoostSnapshotCodes
{
    public static readonly ErrorCode InvalidOrderId = new("boost-snapshot.invalid-order-id");
    public static readonly ErrorCode InvalidRating = new("boost-snapshot.invalid-rating");
    public static readonly ErrorCode InvalidCreatedAt = new("boost-snapshot.invalid-created-at");
}
