namespace Core.Domain.Enums;

public enum OrderStatus
{
    Pending,
    InProgress,
    AwaitingConfirmation,
    Disputed,
    Completed,
    Cancelled
}
