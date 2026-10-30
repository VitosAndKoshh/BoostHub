using Mapster;

namespace Core.Features.Auth.Login;

public sealed class LoginMapping : IRegister
{
    public void Register(TypeAdapterConfig config)
    {
        config.NewConfig<LoginResult, LoginResponse>();
    }
}