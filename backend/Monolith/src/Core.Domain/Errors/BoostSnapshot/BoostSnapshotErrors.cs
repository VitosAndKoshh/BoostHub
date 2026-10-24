using Core.Abstractions.Errors;

namespace Core.Domain.Errors.BoostSnapshot;

public static class BoostSnapshotErrors
{
    public static Error InvalidOrderId =>
        new(BoostSnapshotCodes.InvalidOrderId, ErrorType.Validation, "Invalid order id");

    public static Error InvalidRating =>
        new(BoostSnapshotCodes.InvalidRating, ErrorType.Validation, "Invalid rating");

    public static Error InvalidCreatedAt =>
        new(BoostSnapshotCodes.InvalidCreatedAt, ErrorType.Validation, "Invalid snapshot creation time");
}
