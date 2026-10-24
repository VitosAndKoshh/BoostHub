using Core.Domain.Errors.Game;
using Core.Domain.Exceptions;

namespace Core.Domain.Entities;

public sealed class GameEntity : EntityBase<Guid>
{
    // For EF Core
    private GameEntity()
    {
        Code = null!;
        Name = null!;
    }

    private GameEntity(string code, string name)
    {
        Code = code;
        Name = name;
    }

    public string Code { get; init; }
    public string Name { get; private set; }

    public static GameEntity Create(string code, string name)
    {
        if (string.IsNullOrWhiteSpace(code))
            throw new DomainException(GameErrors.InvalidCode);

        if (string.IsNullOrWhiteSpace(name))
            throw new DomainException(GameErrors.InvalidName);

        return new GameEntity(code.Trim(), name.Trim());
    }

    public void ChangeName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new DomainException(GameErrors.InvalidName);
        Name = name.Trim();
    }
}
