using Core.Domain.Errors.Credentials;
using FluentValidation;

namespace Core.Features.Auth.Register;

public sealed class RegisterCommandValidator : AbstractValidator<RegisterCommand>
{
    public RegisterCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Invalid email").WithErrorCode(CredentialCodes.InvalidEmail.Value)
            .EmailAddress().WithMessage("Invalid email").WithErrorCode(CredentialCodes.InvalidEmail.Value);
        
        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required").WithErrorCode(CredentialCodes.InvalidPassword.Value)
            .MinimumLength(6).WithMessage("Invalid Password").WithErrorCode(CredentialCodes.InvalidPassword.Value)
            .MaximumLength(255).WithMessage("Invalid Password").WithErrorCode(CredentialCodes.InvalidPassword.Value);
    }
}