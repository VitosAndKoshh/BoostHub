using Core.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Adapters.Outbound.Postgres.EntityConfigurations;

internal sealed class BoosterEntityConfiguration : IEntityTypeConfiguration<BoosterEntity>
{
    public void Configure(EntityTypeBuilder<BoosterEntity> builder)
    {
        builder.ToTable("boosters")
            .HasKey(x => x.Id);
        
        builder.Property(x => x.Id)
            .HasColumnName("id")
            .ValueGeneratedNever()
            .IsRequired();
        
        builder.Property(x => x.AccountId)
            .HasColumnName("account_id")
            .IsRequired();
        
        builder.Property(x => x.Status)
            .HasColumnName("status")
            .HasConversion<string>()
            .IsRequired();
        
        builder.HasIndex(x => x.AccountId)
            .IsUnique();

        builder.OwnsOne(x => x.DiscordNickname, nickname =>
        {
            nickname.Property(x => x.Nickname)
                .HasColumnName("discord_nickname")
                .IsRequired();
        });

        builder.HasOne<AccountEntity>()
            .WithMany()
            .HasForeignKey(x => x.AccountId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => x.AccountId)
            .IsUnique();
    }
}
