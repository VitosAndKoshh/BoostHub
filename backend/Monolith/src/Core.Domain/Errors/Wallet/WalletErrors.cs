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

    public static Error InvalidAmount =>
        new (WalletCodes.InvalidAmount, ErrorType.Validation, "Wallet amount must be greater than zero");

    public static Error InsufficientFunds =>
        new (WalletCodes.InsufficientFunds, ErrorType.Conflict, "Insufficient wallet funds");

    public static Error BalanceOverflow =>
        new (WalletCodes.BalanceOverflow, ErrorType.Conflict, "Wallet balance overflow");
}
