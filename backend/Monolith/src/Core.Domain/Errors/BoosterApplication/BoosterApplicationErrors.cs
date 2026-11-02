using Core.Abstractions.Errors;

namespace Core.Domain.Errors.BoosterApplication;

public static class BoosterApplicationErrors
{
    public static Error InvalidBoosterId =>
        new(BoosterApplicationCodes.InvalidBoosterId, ErrorType.Validation, "Invalid booster id");

    public static Error InvalidVerificationGamePlatformAccountId =>
        new(BoosterApplicationCodes.InvalidVerificationGamePlatformAccountId, ErrorType.Validation, "Invalid verification game platform account id");

    public static Error InvalidReviewerUserId =>
        new(BoosterApplicationCodes.InvalidReviewerUserId, ErrorType.Validation, "Invalid reviewer user id");

    public static Error InvalidRejectionReason =>
        new(BoosterApplicationCodes.InvalidRejectionReason, ErrorType.Validation, "Invalid rejection reason");

    public static Error AlreadyReviewed =>
        new(BoosterApplicationCodes.AlreadyReviewed, ErrorType.Conflict, "Booster application has already been reviewed");
}
