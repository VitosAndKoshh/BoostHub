using Core.Domain.Enums;
using Core.Domain.Errors.GamePlatformAccount;
using Core.Domain.Exceptions;

namespace Core.Domain.Entities;

public sealed class GamePlatformAccountEntity : EntityBase<Guid>
{
    // For EF Core
    private GamePlatformAccountEntity()
    {
        PlatformUserId = null!;
    }

    private GamePlatformAccountEntity(
        Guid accountId,
        GamePlatform platform,
        string platformUserId)
    {
        AccountId = accountId;
        Platform = platform;
        PlatformUserId = platformUserId;
    }

    public Guid AccountId { get; init; }
    public GamePlatform Platform { get; init; }
    public string PlatformUserId { get; init; }

    public static GamePlatformAccountEntity Create(
        Guid accountId,
        GamePlatform platform,
        string platformUserId)
    {
        if (accountId == Guid.Empty)
            throw new DomainException(GamePlatformAccountErrors.InvalidAccountId);

        if (!Enum.IsDefined(platform))
            throw new DomainException(GamePlatformAccountErrors.InvalidPlatform);

        if (string.IsNullOrWhiteSpace(platformUserId))
            throw new DomainException(GamePlatformAccountErrors.InvalidPlatformUserId);

        return new GamePlatformAccountEntity(accountId, platform, platformUserId.Trim());
    }
}
