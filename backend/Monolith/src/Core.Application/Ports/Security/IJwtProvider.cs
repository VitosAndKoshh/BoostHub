namespace Core.Application.Ports.Security;

public interface IJwtProvider
{
    string Generate(Guid userId, string role);
}