using Core.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Adapters.Outbound.Postgres.EntityConfigurations;

internal sealed class BoosterApplicationEntityConfiguration : IEntityTypeConfiguration<BoosterApplicationEntity>
{
    public void Configure(EntityTypeBuilder<BoosterApplicationEntity> builder)
    {
        builder.ToTable("booster_applications")
            .HasKey(x => x.Id);

        builder.Property(x => x.Id)
            .HasColumnName("id")
            .ValueGeneratedNever()
            .IsRequired();

        builder.Property(x => x.BoosterId)
            .HasColumnName("booster_id")
            .IsRequired();

        builder.Property(x => x.VerificationGamePlatformAccountId)
            .HasColumnName("verification_game_platform_account_id")
            .IsRequired();

        builder.Property(x => x.Status)
            .HasColumnName("status")
            .HasConversion<string>()
            .IsRequired();

        builder.Property(x => x.AppliedAt)
            .HasColumnName("applied_at")
            .IsRequired();

        builder.Property(x => x.ReviewedAt)
            .HasColumnName("reviewed_at")
            .IsRequired(false);

        builder.Property(x => x.ReviewedByUserId)
            .HasColumnName("reviewed_by_user_id")
            .IsRequired(false);

        builder.Property(x => x.RejectionReason)
            .HasColumnName("rejection_reason")
            .IsRequired(false);

        builder.HasIndex(x => x.BoosterId);
        builder.HasIndex(x => new { x.Status, x.AppliedAt });

        builder.HasOne<BoosterEntity>()
            .WithMany()
            .HasForeignKey(x => x.BoosterId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<GamePlatformAccountEntity>()
            .WithMany()
            .HasForeignKey(x => x.VerificationGamePlatformAccountId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne<UserEntity>()
            .WithMany()
            .HasForeignKey(x => x.ReviewedByUserId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
