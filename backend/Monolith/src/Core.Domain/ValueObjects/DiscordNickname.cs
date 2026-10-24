using Core.Domain.Errors.Booster;
using Core.Domain.Exceptions;

namespace Core.Domain.ValueObjects;

public class DiscordNickname : ValueObjectBase
{
    // EF Core constructor
    private DiscordNickname()
    {
        Nickname = null!;
    }
    private DiscordNickname(string nickname)
    {
        Nickname = nickname;
    }
    
    public string Nickname { get; }
    
    public static DiscordNickname Create(string nickname)
    {
        if (string.IsNullOrWhiteSpace(nickname))
            throw new DomainException(BoosterErrors.InvalidDiscordNickname);
        return new DiscordNickname(nickname);
    }
    
    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return Nickname;
    }
    
    public static implicit operator string(DiscordNickname nickname) => nickname.Nickname;
    public static explicit operator DiscordNickname(string value) => Create(value);   
}