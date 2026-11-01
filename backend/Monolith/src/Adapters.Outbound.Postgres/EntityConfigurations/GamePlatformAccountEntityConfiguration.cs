using Core.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Adapters.Outbound.Postgres.EntityConfigurations;

internal sealed class GamePlatformAccountEntityConfiguration : IEntityTypeConfiguration<GamePlatformAccountEntity>
{
    public void Configure(EntityTypeBuilder<GamePlatformAccountEntity> builder)
    {
        builder.ToTable("game_platform_accounts")
            .HasKey(x => x.Id);

        builder.Property(x => x.Id)
            .HasColumnName("id")
            .ValueGeneratedNever()
            .IsRequired();

        builder.Property(x => x.AccountId)
            .HasColumnName("account_id")
            .IsRequired();

        builder.Property(x => x.Platform)
            .HasColumnName("platform")
            .HasConversion<string>()
            .IsRequired();

        builder.Property(x => x.PlatformUserId)
            .HasColumnName("platform_user_id")
            .IsRequired();

        builder.HasIndex(x => new { x.Platform, x.PlatformUserId })
            .IsUnique();
    }
}
