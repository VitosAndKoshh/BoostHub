using Core.Abstractions.Primitives;

namespace Core.Domain.Errors.Consumer;

public sealed class ConsumerCodes
{
    public static readonly ErrorCode InvalidAccountId = new ("consumer.invalid-account-id");
}