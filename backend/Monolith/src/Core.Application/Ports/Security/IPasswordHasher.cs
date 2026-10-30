using Core.Application.Results;

namespace Core.Application.Ports.Security;

public interface IPasswordHasher
{
    Result<string> HashPassword(string password);
    Result VerifyHashedPassword(string password, string hashedPassword);
}