using Mapster;

namespace Core.Features.Auth.Register;

public class RegisterMapping : IRegister
{
    public void Register(TypeAdapterConfig config)
    {
        config.NewConfig<RegisterResult, RegisterResponse>();
    }
}