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
        CreatedAt = DateTime.UtcNow;
        Status = OrderStatus.Pending;
    }

    public Guid OfferId { get; init; }
    public Guid CustomerId { get; init; }
    public Guid BoosterId { get; init; }
    public Price AgreedPrice { get; init; }
    public MaxCompletionDuration MaxCompletionDuration { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? StartedAt { get; private set; }
    public DateTime? SubmittedForConfirmationAt { get; private set; }
    public DateTime? DisputedAt { get; private set; }
    public DateTime? CompletedAt { get; private set; }
    public DateTime? CancelledAt { get; private set; }
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
        StartedAt = DateTime.UtcNow;
        Status = OrderStatus.InProgress;
    }

    public void SubmitForConfirmation()
    {
        EnsureStatus(OrderStatus.InProgress);
        SubmittedForConfirmationAt = DateTime.UtcNow;
        Status = OrderStatus.AwaitingConfirmation;
    }

    public void ConfirmCompletion()
    {
        EnsureStatus(OrderStatus.AwaitingConfirmation);
        CompletedAt = DateTime.UtcNow;
        Status = OrderStatus.Completed;
    }

    public void RaiseDispute()
    {
        if (Status is not (OrderStatus.InProgress or OrderStatus.AwaitingConfirmation))
            throw new DomainException(OrderErrors.InvalidStatusTransition);

        DisputedAt = DateTime.UtcNow;
        Status = OrderStatus.Disputed;
    }

    public void ResolveDisputeAsCompleted()
    {
        EnsureStatus(OrderStatus.Disputed);
        CompletedAt = DateTime.UtcNow;
        Status = OrderStatus.Completed;
    }

    public void ResolveDisputeAsCancelled()
    {
        EnsureStatus(OrderStatus.Disputed);
        CancelledAt = DateTime.UtcNow;
        Status = OrderStatus.Cancelled;
    }

    public void Cancel()
    {
        EnsureStatus(OrderStatus.Pending);
        CancelledAt = DateTime.UtcNow;
        Status = OrderStatus.Cancelled;
    }

    private void EnsureStatus(OrderStatus expectedStatus)
    {
        if (Status != expectedStatus)
            throw new DomainException(OrderErrors.InvalidStatusTransition);
    }
}
