using Core.Domain.Enums;
using Core.Domain.Errors.BoostRequest;
using Core.Domain.Exceptions;
using Core.Domain.ValueObjects;

namespace Core.Domain.Entities;

public sealed class BoostRequestEntity : EntityBase<Guid>
{
    // For EF Core
    private BoostRequestEntity()
    {
        Price = null!;
        Description = null!;
        MaxCompletionDuration = null!;
    }

    private BoostRequestEntity(
        Guid customerId,
        Guid gameId,
        Price price,
        string description,
        MaxCompletionDuration maxCompletionDuration)
    {
        CustomerId = customerId;
        GameId = gameId;
        Price = price;
        Description = description;
        MaxCompletionDuration = maxCompletionDuration;
        RequestedAt = DateTime.UtcNow;
        Status = BoostRequestStatus.Open;
    }

    public Guid CustomerId { get; private set; }
    public Guid GameId { get; private set; }
    public Price Price { get; private set; }
    public string Description { get; private set; }
    public MaxCompletionDuration MaxCompletionDuration { get; private set; }
    public DateTime RequestedAt { get; private set; }
    public BoostRequestStatus Status { get; private set; }

    public static BoostRequestEntity Create(
        Guid customerId,
        Guid gameId,
        Price price,
        string description,
        MaxCompletionDuration maxCompletionDuration)
    {
        if (customerId == Guid.Empty)
            throw new DomainException(BoostRequestErrors.InvalidCustomerId);

        if (gameId == Guid.Empty)
            throw new DomainException(BoostRequestErrors.InvalidGameId);

        if (price is null)
            throw new DomainException(BoostRequestErrors.InvalidPrice);

        if (string.IsNullOrWhiteSpace(description))
            throw new DomainException(BoostRequestErrors.InvalidDescription);

        if (maxCompletionDuration is null)
            throw new DomainException(BoostRequestErrors.InvalidMaxCompletionDuration);

        return new BoostRequestEntity(
            customerId,
            gameId,
            price,
            description.Trim(),
            maxCompletionDuration);
    }

    public void Close()
    {
        EnsureOpen();
        Status = BoostRequestStatus.Closed;
    }

    public void Cancel()
    {
        EnsureOpen();
        Status = BoostRequestStatus.Cancelled;
    }

    private void EnsureOpen()
    {
        if (Status == BoostRequestStatus.Closed)
            throw new DomainException(BoostRequestErrors.RequestAlreadyClosed);

        if (Status == BoostRequestStatus.Cancelled)
            throw new DomainException(BoostRequestErrors.RequestAlreadyCancelled);
    }
}
