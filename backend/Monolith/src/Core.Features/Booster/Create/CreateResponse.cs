using Core.Domain.Enums;

namespace Core.Features.Booster.Create;

public sealed record CreateResponse(
    Guid BoosterId,
    Guid ApplicationId,
    BoosterApplicationStatus ApplicationStatus);
