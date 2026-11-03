using Core.Domain.Enums;
using Core.Domain.Errors.BoosterApplication;
using Core.Domain.Exceptions;

namespace Core.Domain.Entities;

public sealed class BoosterApplicationEntity : EntityBase<Guid>
{
    // For EF Core
    private BoosterApplicationEntity()
    {
    }

    private BoosterApplicationEntity(Guid boosterId)
    {
        BoosterId = boosterId;
        Status = BoosterApplicationStatus.Pending;
        AppliedAt = DateTimeOffset.UtcNow;
    }

    public Guid BoosterId { get; init; }
    public BoosterApplicationStatus Status { get; private set; }
    public DateTimeOffset AppliedAt { get; init; }
    public DateTimeOffset? ReviewedAt { get; private set; }
    public Guid? ReviewedByUserId { get; private set; }
    public string? RejectionReason { get; private set; }

    public static BoosterApplicationEntity Create(Guid boosterId)
    {
        if (boosterId == Guid.Empty)
            throw new DomainException(BoosterApplicationErrors.InvalidBoosterId);

        return new BoosterApplicationEntity(boosterId);
    }

    public void Approve(Guid reviewerUserId)
    {
        EnsurePending();
        EnsureReviewer(reviewerUserId);

        Status = BoosterApplicationStatus.Approved;
        ReviewedAt = DateTimeOffset.UtcNow;
        ReviewedByUserId = reviewerUserId;
        RejectionReason = null;
    }

    public void Reject(Guid reviewerUserId, string rejectionReason)
    {
        EnsurePending();
        EnsureReviewer(reviewerUserId);

        if (string.IsNullOrWhiteSpace(rejectionReason))
            throw new DomainException(BoosterApplicationErrors.InvalidRejectionReason);

        Status = BoosterApplicationStatus.Rejected;
        ReviewedAt = DateTimeOffset.UtcNow;
        ReviewedByUserId = reviewerUserId;
        RejectionReason = rejectionReason.Trim();
    }

    private void EnsurePending()
    {
        if (Status != BoosterApplicationStatus.Pending)
            throw new DomainException(BoosterApplicationErrors.AlreadyReviewed);
    }

    private static void EnsureReviewer(Guid reviewerUserId)
    {
        if (reviewerUserId == Guid.Empty)
            throw new DomainException(BoosterApplicationErrors.InvalidReviewerUserId);
    }
}
