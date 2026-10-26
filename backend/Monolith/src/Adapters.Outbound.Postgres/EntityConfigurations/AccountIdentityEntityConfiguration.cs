using Core.Domain.Entities;
using Core.Domain.ValueObjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Adapters.Outbound.Postgres.EntityConfigurations;

internal sealed class AccountIdentityEntityConfiguration : IEntityTypeConfiguration<AccountIdentityEntity>
{
    public void Configure(EntityTypeBuilder<AccountIdentityEntity> builder)
    {
        builder.ToTable("account_identities")
            .HasKey(x => new { x.AccountId, x.IdentityId });

        builder.Property(x => x.AccountId)
            .HasColumnName("account_id")
            .IsRequired();
        
        builder.Property(x => x.IdentityId)
            .HasColumnName("identity_id")
            .IsRequired();
        
        builder.Property(x => x.IdentityProvider)
            .HasColumnName("identity_provider")
            .HasConversion(
                x => x.Provider,
                x => IdentityProvider.From(x)
            )
            .IsRequired();

        builder.HasIndex(x => new { x.AccountId, x.IdentityProvider })
            .IsUnique();
    }
}
