using Core.Domain.Enums;
using Core.Domain.Errors.Order;
using Core.Domain.Exceptions;
using Core.Domain.ValueObjects;

namespace Core.Domain.Entities;

public sealed class OrderEntity : EntityBase<Guid>
{
    // For EF Core
    private OrderEntity()
    {
        AgreedPrice = null!;
        MaxCompletionDuration = null!;
    }

    private OrderEntity(
        Guid offerId,
        Guid customerId,
        Guid boosterId,
        Price agreedPrice,
        MaxCompletionDuration maxCompletionDuration)
    {
        OfferId = offerId;
        CustomerId = customerId;
        BoosterId = boosterId;
        AgreedPrice = agreedPrice;
        MaxCompletionDuration = maxCompletionDuration;
        CreatedAt = DateTimeOffset.UtcNow;
        Status = OrderStatus.Pending;
    }

    public Guid OfferId { get; init; }
    public Guid CustomerId { get; init; }
    public Guid BoosterId { get; init; }
    public Price AgreedPrice { get; init; }
    public MaxCompletionDuration MaxCompletionDuration { get; init; }
    public DateTimeOffset CreatedAt { get; init; }
    public DateTimeOffset? StartedAt { get; private set; }
    public DateTimeOffset? SubmittedForConfirmationAt { get; private set; }
    public DateTimeOffset? DisputedAt { get; private set; }
    public DateTimeOffset? CompletedAt { get; private set; }
    public DateTimeOffset? CancelledAt { get; private set; }
    public OrderStatus Status { get; private set; }

    public static OrderEntity Create(
        Guid offerId,
        Guid customerId,
        Guid boosterId,
        Price agreedPrice,
        MaxCompletionDuration maxCompletionDuration)
    {
        if (offerId == Guid.Empty)
            throw new DomainException(OrderErrors.InvalidOfferId);

        if (customerId == Guid.Empty)
            throw new DomainException(OrderErrors.InvalidCustomerId);

        if (boosterId == Guid.Empty)
            throw new DomainException(OrderErrors.InvalidBoosterId);

        if (agreedPrice is null)
            throw new DomainException(OrderErrors.InvalidAgreedPrice);

        if (maxCompletionDuration is null)
            throw new DomainException(OrderErrors.InvalidMaxCompletionDuration);

        return new OrderEntity(
            offerId,
            customerId,
            boosterId,
            agreedPrice,
            maxCompletionDuration);
    }

    public void Start()
    {
        EnsureStatus(OrderStatus.Pending);
        StartedAt = DateTimeOffset.UtcNow;
        Status = OrderStatus.InProgress;
    }

    public void SubmitForConfirmation()
    {
        EnsureStatus(OrderStatus.InProgress);
        SubmittedForConfirmationAt = DateTimeOffset.UtcNow;
        Status = OrderStatus.AwaitingConfirmation;
    }

    public void ConfirmCompletion()
    {
        EnsureStatus(OrderStatus.AwaitingConfirmation);
        CompletedAt = DateTimeOffset.UtcNow;
        Status = OrderStatus.Completed;
    }

    public void RaiseDispute()
    {
        if (Status is not (OrderStatus.InProgress or OrderStatus.AwaitingConfirmation))
            throw new DomainException(OrderErrors.InvalidStatusTransition);

        DisputedAt = DateTimeOffset.UtcNow;
        Status = OrderStatus.Disputed;
    }

    public void ResolveDisputeAsCompleted()
    {
        EnsureStatus(OrderStatus.Disputed);
        CompletedAt = DateTimeOffset.UtcNow;
        Status = OrderStatus.Completed;
    }

    public void ResolveDisputeAsCancelled()
    {
        EnsureStatus(OrderStatus.Disputed);
        CancelledAt = DateTimeOffset.UtcNow;
        Status = OrderStatus.Cancelled;
    }

    public void Cancel()
    {
        EnsureStatus(OrderStatus.Pending);
        CancelledAt = DateTimeOffset.UtcNow;
        Status = OrderStatus.Cancelled;
    }

    private void EnsureStatus(OrderStatus expectedStatus)
    {
        if (Status != expectedStatus)
            throw new DomainException(OrderErrors.InvalidStatusTransition);
    }
}
