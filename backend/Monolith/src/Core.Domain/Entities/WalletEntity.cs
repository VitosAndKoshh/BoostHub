using Core.Domain.AggregateRoot;
using Core.Domain.Enums;
using Core.Domain.Errors.Wallet;
using Core.Domain.Exceptions;

namespace Core.Domain.Entities;

public sealed class WalletEntity : AggregateRootBase<Guid>
{
    // For EF Core
    // private WalletEntity(){}
    //
    // private WalletEntity(Guid accountId)
    // {
    //     AccountId = accountId;
    //     Balance = 0m;
    //     AvailableBalance = 0m;
    //     Version = 0;
    // }
    //
    // public Guid AccountId { get; init; }
    // public decimal Balance { get; private set; }
    // public decimal AvailableBalance { get; private set; }   
    // public decimal ReservedBalance { get; private set; }
    // public int Version { get; private set; }
    //
    // private readonly IList<WalletTransactionEntity> _transactions = new List<WalletTransactionEntity>();
    // public IReadOnlyCollection<WalletTransactionEntity> Transactions => _transactions.AsReadOnly();
    //
    // public static WalletEntity Create(Guid accountId)
    // {
    //     if (accountId == Guid.Empty)
    //         throw new DomainException(WalletErrors.InvalidAccountId);
    //     
    //     return new WalletEntity(accountId);
    // }
    //
    // public void Proud(Guid transactionId)
    // {
    //     var transaction = _transactions.SingleOrDefault(t => t.Id == transactionId);
    //     if (transaction == null)
    //         throw new DomainException(WalletErrors.TransactionNotFound);
    //     
    //     if (Balance + transaction.Amount < 0)
    //         throw new DomainException(WalletErrors.NegativeBalance);
    //     Balance += transaction.Amount;
    //     transaction.SetStatus(TransactionStatus.Approved);
    //     Version++;
    // }
    //
    // public void Reserve(decimal amount)
    // {
    //     if (AvailableBalance + amount < 0)
    //         throw new DomainException(WalletErrors.NegativeBalance);
    //     var transaction = WalletTransactionEntity.Create(Id, amount);
    //     _transactions.Add(transaction);
    //     AvailableBalance += transaction.Amount;
    // }
}