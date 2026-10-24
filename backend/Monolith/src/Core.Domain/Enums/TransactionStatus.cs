using Core.Domain.Errors.Wallet;
using Core.Domain.Exceptions;

namespace Core.Domain.Enums;

public enum TransactionStatus
{
    Approved,
    Pending,
    Rejected
}

public static class TransactionStatusExtensions
{
    public static TransactionStatus TryParse(this string status)
    {
        if (Enum.TryParse(status, true, out TransactionStatus result))
            return result;

        throw new DomainException(WalletErrors.InvalidTransactionStatus);
    }   
}