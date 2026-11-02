using Core.Domain.Errors.User;
using FluentValidation;

namespace Core.Features.Auth.Register;

public sealed class RegisterCommandValidator : AbstractValidator<RegisterCommand>
{
    public RegisterCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Invalid email").WithErrorCode(UserCodes.InvalidEmail.Value)
            .EmailAddress().WithMessage("Invalid email").WithErrorCode(UserCodes.InvalidEmail.Value);
        
        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required").WithErrorCode(UserCodes.InvalidPassword.Value)
            .MinimumLength(6).WithMessage("Invalid Password").WithErrorCode(UserCodes.InvalidPassword.Value)
            .MaximumLength(255).WithMessage("Invalid Password").WithErrorCode(UserCodes.InvalidPassword.Value);
    }
}
