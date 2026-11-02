using Core.Domain.Errors.Wallet;
using Core.Domain.Exceptions;

namespace Core.Domain.Entities;

public sealed class WalletEntity : EntityBase<Guid>
{
    // For EF Core.
    private WalletEntity() { }

    private WalletEntity(Guid accountId)
    {
        AccountId = accountId;
        Balance = 0m;
        CreatedAt = DateTimeOffset.UtcNow;
    }

    public Guid AccountId { get; init; }
    public decimal Balance { get; private set; }
    public DateTimeOffset CreatedAt { get; init; }

    public static WalletEntity Create(Guid accountId)
    {
        if (accountId == Guid.Empty)
            throw new DomainException(WalletErrors.InvalidAccountId);

        return new WalletEntity(accountId);
    }

    public void Credit(decimal amount)
    {
        EnsurePositiveAmount(amount);

        if (amount > decimal.MaxValue - Balance)
            throw new DomainException(WalletErrors.BalanceOverflow);

        Balance += amount;
    }

    public void Debit(decimal amount)
    {
        EnsurePositiveAmount(amount);

        if (amount > Balance)
            throw new DomainException(WalletErrors.InsufficientFunds);

        Balance -= amount;
    }

    private static void EnsurePositiveAmount(decimal amount)
    {
        if (amount <= 0m)
            throw new DomainException(WalletErrors.InvalidAmount);
    }
}
