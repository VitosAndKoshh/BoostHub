using Core.Abstractions.Errors;

namespace Core.Domain.Errors.Wallet;

public static class WalletErrors
{
    public static Error InvalidAccountId =>
        new (WalletCodes.InvalidAccountId, ErrorType.Validation, "Invalid account id");
    
    public static Error InvalidWalletId =>
        new (WalletCodes.InvalidWalletId, ErrorType.Validation, "Invalid wallet id");
    
    public static Error TransactionNotFound =>
        new (WalletCodes.TransactionNotFound, ErrorType.NotFound, "Transaction not found");
    
    public static Error InvalidTransactionStatus =>
        new (WalletCodes.InvalidTransactionStatus, ErrorType.Validation, "Invalid transaction status");
    
    public static Error NegativeBalance =>
        new (WalletCodes.NegativeBalance, ErrorType.Conflict, "Balance cannot be negative");
}