using Core.Abstractions.Errors;
using Core.Abstractions.Primitives;
using Core.Domain.Errors.Credentials;
using Core.Domain.Exceptions;

namespace Core.Domain.Entities;

public sealed class LocalCredentialEntity : EntityBase<Guid>
{
    // For EF Core
    private LocalCredentialEntity()
    {
        Email = null!;
        PasswordHash = null!;
    }

    private LocalCredentialEntity(string email, string passwordHash, Guid roleId)
    {
        Email = email;
        PasswordHash = passwordHash;
        RoleId = roleId;       
        CreatedAt = DateTime.UtcNow;
    }
    
    public string Email { get; private set; }
    public string PasswordHash { get; private set; }
    public Guid RoleId { get; private set; }   
    public DateTime CreatedAt { get; init; }
    
    public static LocalCredentialEntity Create(string email, string passwordHash, Guid roleId)
    {
        if (string.IsNullOrWhiteSpace(email))
            throw new DomainException(CredentialErrors.InvalidEmail);
        
        if (string.IsNullOrWhiteSpace(passwordHash))
            throw new DomainException(CredentialErrors.InvalidPassword);

        return new LocalCredentialEntity(email.Trim(), passwordHash, roleId);
    }
}