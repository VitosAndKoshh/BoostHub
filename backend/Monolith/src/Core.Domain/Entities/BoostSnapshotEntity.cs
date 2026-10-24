using Core.Domain.Errors.BoostSnapshot;
using Core.Domain.Exceptions;
using Core.Domain.ValueObjects;

namespace Core.Domain.Entities;

public sealed class BoostSnapshotEntity : EntityBase<Guid>
{
    // For EF Core
    private BoostSnapshotEntity()
    {
        Rating = null!;
    }

    private BoostSnapshotEntity(Guid orderId, RatingValue rating, DateTime createdAt)
    {
        OrderId = orderId;
        Rating = rating;
        CreatedAt = createdAt;
    }

    public Guid OrderId { get; init; }
    public RatingValue Rating { get; init; }
    public DateTime CreatedAt { get; init; }

    public static BoostSnapshotEntity Create(Guid orderId, RatingValue rating, DateTime createdAt)
    {
        if (orderId == Guid.Empty)
            throw new DomainException(BoostSnapshotErrors.InvalidOrderId);

        if (rating is null)
            throw new DomainException(BoostSnapshotErrors.InvalidRating);

        if (createdAt == default || createdAt.Kind != DateTimeKind.Utc)
            throw new DomainException(BoostSnapshotErrors.InvalidCreatedAt);

        return new BoostSnapshotEntity(orderId, rating, createdAt);
    }
}
