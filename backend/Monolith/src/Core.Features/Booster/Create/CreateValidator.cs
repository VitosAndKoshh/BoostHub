using Core.Domain.Errors.Booster;
using FluentValidation;

namespace Core.Features.Booster.Create;

public sealed class CreateValidator : AbstractValidator<CreateCommand>
{
    public CreateValidator()
    {
        RuleFor(x => x.DiscordNickname)
            .NotEmpty()
            .WithMessage("Invalid discord nickname")
            .WithErrorCode(BoosterCodes.InvalidDiscordNickname.Value);
    }
}
