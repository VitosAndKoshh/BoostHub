using Core.Domain.Enums;
using Core.Domain.Errors.Wallet;
using Core.Domain.Exceptions;

namespace Core.Domain.Entities;

public sealed class WalletTransactionEntity : EntityBase<Guid>
{
    // For EF Core
    private WalletTransactionEntity(){}

    private WalletTransactionEntity(
        Guid walletId,
        decimal amount,
        TransactionStatus status)
    {
        WalletId = walletId;
        Amount = amount;
        Status = status;
        CreatedAt = DateTime.UtcNow;       
    }
    
    public Guid WalletId { get; init; }
    public decimal Amount { get; init; }
    public TransactionStatus Status { get; private set; }
    public DateTime CreatedAt { get; init; }

    public static WalletTransactionEntity Create(Guid walletId, decimal amount)
    {
        if (walletId == Guid.Empty)
            throw new DomainException(WalletErrors.InvalidWalletId);
        
        return new WalletTransactionEntity(walletId, amount, TransactionStatus.Pending);
    }
    
    public void SetStatus(TransactionStatus status)
        => Status = status;
}