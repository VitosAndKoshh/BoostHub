using Core.Abstractions.Primitives;

namespace Core.Domain.Errors.BoosterApplication;

public static class BoosterApplicationCodes
{
    public static readonly ErrorCode InvalidBoosterId = new("booster-application.invalid-booster-id");
    public static readonly ErrorCode InvalidReviewerUserId = new("booster-application.invalid-reviewer-user-id");
    public static readonly ErrorCode InvalidRejectionReason = new("booster-application.invalid-rejection-reason");
    public static readonly ErrorCode AlreadyReviewed = new("booster-application.already-reviewed");
}
