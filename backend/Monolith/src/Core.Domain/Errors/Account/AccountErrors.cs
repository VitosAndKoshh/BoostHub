using Core.Abstractions.Errors;

namespace Core.Domain.Errors.Account;

public static class AccountErrors
{
    public static Error InvalidIdentityId =>
        new (AccountCodes.InvalidIdentityId, ErrorType.Validation, "Invalid identity id");
    
    public static Error InvalidAccountId =>
            new (AccountCodes.InvalidAccountId, ErrorType.Validation, "Invalid account id");

    public static Error IdentityAlreadyExist =>
            new (AccountCodes.IdentityAlreadyExist, ErrorType.Conflict, "Identity already exist");

    public static Error InvalidSteamId =>
        new (AccountCodes.InvalidSteamId, ErrorType.Validation, "Invalid steam id");
    
    public static Error InvalidIdentityProvider =>
        new (AccountCodes.InvalidIdentityProvider, ErrorType.Validation, "Invalid identity provider");
}