using Core.Domain.Enums;
using Core.Domain.Errors.Offer;
using Core.Domain.Exceptions;
using Core.Domain.ValueObjects;

namespace Core.Domain.Entities;

public sealed class OfferEntity : EntityBase<Guid>
{
    // For EF Core
    private OfferEntity()
    {
        Price = null!;
        Description = null!;
        MaxCompletionDuration = null!;
    }

    private OfferEntity(
        Guid boostRequestId,
        Guid boosterId,
        Price price,
        string description,
        MaxCompletionDuration maxCompletionDuration)
    {
        BoostRequestId = boostRequestId;
        BoosterId = boosterId;
        Price = price;
        Description = description;
        MaxCompletionDuration = maxCompletionDuration;
        CreatedAt = DateTime.UtcNow;
        Status = OfferStatus.Pending;
    }

    public Guid BoostRequestId { get; init; }
    public Guid BoosterId { get; init; }
    public Price Price { get; init; }
    public string Description { get; init; }
    public MaxCompletionDuration MaxCompletionDuration { get; init; }
    public DateTime CreatedAt { get; init; }
    public OfferStatus Status { get; private set; }

    public static OfferEntity Create(
        Guid boostRequestId,
        Guid boosterId,
        Price price,
        string description,
        MaxCompletionDuration maxCompletionDuration)
    {
        if (boostRequestId == Guid.Empty)
            throw new DomainException(OfferErrors.InvalidBoostRequestId);

        if (boosterId == Guid.Empty)
            throw new DomainException(OfferErrors.InvalidBoosterId);

        if (price is null)
            throw new DomainException(OfferErrors.InvalidPrice);

        if (string.IsNullOrWhiteSpace(description))
            throw new DomainException(OfferErrors.InvalidDescription);

        if (maxCompletionDuration is null)
            throw new DomainException(OfferErrors.InvalidMaxCompletionDuration);

        return new OfferEntity(
            boostRequestId,
            boosterId,
            price,
            description.Trim(),
            maxCompletionDuration);
    }

    public void Accept()
    {
        EnsurePending();
        Status = OfferStatus.Accepted;
    }

    public void Reject()
    {
        EnsurePending();
        Status = OfferStatus.Rejected;
    }

    public void Withdraw()
    {
        EnsurePending();
        Status = OfferStatus.Withdrawn;
    }

    private void EnsurePending()
    {
        switch (Status)
        {
            case OfferStatus.Accepted:
                throw new DomainException(OfferErrors.OfferAlreadyAccepted);
            case OfferStatus.Rejected:
                throw new DomainException(OfferErrors.OfferAlreadyRejected);
            case OfferStatus.Withdrawn:
                throw new DomainException(OfferErrors.OfferAlreadyWithdrawn);
        }
    }
}
