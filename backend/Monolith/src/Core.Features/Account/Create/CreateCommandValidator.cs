using Core.Domain.Errors.Account;
using FluentValidation;

namespace Core.Features.Account.Create;

public sealed class CreateCommandValidator : AbstractValidator<CreateCommand>
{
    public CreateCommandValidator()
    {
        RuleFor(x => x.Provider)
            .NotEmpty().WithMessage("Provider is required").WithErrorCode(AccountCodes.InvalidIdentityProvider.Value);

        RuleFor(x => x.ProviderUserId)
            .NotEmpty().WithMessage("Provider user id is required").WithErrorCode(AccountCodes.InvalidIdentityId.Value);
    }
}