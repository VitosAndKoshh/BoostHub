using Core.Abstractions.Errors;

namespace Core.Domain.Errors.Consumer;

public static class ConsumerErrors
{
    public static Error InvalidAccountId =>
        new (ConsumerCodes.InvalidAccountId, ErrorType.Validation, "Invalid account id");
}