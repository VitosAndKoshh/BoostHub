using Core.Domain.Errors.Consumer;
using FluentValidation;

namespace Core.Features.Customer.Create;

public sealed class CreateCustomerCommandValidator : AbstractValidator<CreateCustomerCommand>
{
    public CreateCustomerCommandValidator()
    {
        RuleFor(x => x.AccountId)
            .NotEmpty()
            .WithMessage("Account id is required")
            .WithErrorCode(ConsumerCodes.InvalidAccountId.Value);
    }
}
