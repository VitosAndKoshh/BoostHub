using Core.Domain.Errors.Credentials;
using FluentValidation;

namespace Core.Features.Auth.Login;

public sealed class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Invalid email").WithErrorCode(CredentialCodes.InvalidEmail.Value)
            .EmailAddress().WithMessage("Invalid email").WithErrorCode(CredentialCodes.InvalidEmail.Value);
        
        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required").WithErrorCode(CredentialCodes.InvalidPassword.Value)
            .MinimumLength(6).WithMessage("Invalid password").WithErrorCode(CredentialCodes.InvalidPassword.Value)
            .MaximumLength(255).WithMessage("Invalid password").WithErrorCode(CredentialCodes.InvalidPassword.Value);
    }
}