using Core.Domain.Enums;

namespace Core.Features.Booster.Create;

public sealed record CreateResult(
    Guid BoosterId,
    Guid ApplicationId,
    BoosterApplicationStatus ApplicationStatus);
