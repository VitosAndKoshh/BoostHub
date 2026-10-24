using Core.Abstractions.Primitives;

namespace Core.Domain.Errors.Wallet;

public sealed class WalletCodes
{
    public static readonly ErrorCode InvalidAccountId = new ("wallet.invalid-account-id");
    public static readonly ErrorCode InvalidWalletId = new ("wallet.invalid-wallet-id");
    public static readonly ErrorCode InvalidTransactionStatus = new ("wallet.invalid-transaction-status");
    public static readonly ErrorCode NegativeBalance = new ("wallet.negative-balance");
    public static readonly ErrorCode TransactionNotFound = new ("wallet.transaction-not-found");
}