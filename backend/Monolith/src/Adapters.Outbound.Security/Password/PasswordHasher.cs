using Core.Application.Ports.Security;
using Core.Application.Results;
using Core.Domain.Errors.Credentials;

namespace Adapters.Outbound.Security.Password;

public class PasswordHasher : IPasswordHasher
{
    public Result<string> HashPassword(string password)
    {
        var hashedPassword = BCrypt.Net.BCrypt.HashPassword(password);
        return hashedPassword;
    }

    public Result VerifyHashedPassword(string password, string hashedPassword)
    {
        var result = BCrypt.Net.BCrypt.Verify(password, hashedPassword);
        if (result)
            return CredentialErrors.InvalidPasswordValidation;
        
        return Result.Success();
    }
}