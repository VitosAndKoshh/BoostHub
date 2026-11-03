using Mapster;

namespace Core.Features.Booster.Create;

public sealed class CreateMapping : IRegister
{
    public void Register(TypeAdapterConfig config)
    {
        config.NewConfig<CreateResult, CreateResponse>();
    }

    public static CreateCommand ToCommand(CreateRequest request)
        => new(request.DiscordNickname);
}
