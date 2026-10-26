using Core.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Adapters.Outbound.Postgres.EntityConfigurations;

internal sealed class WalletTransactionEntityConfiguration : IEntityTypeConfiguration<WalletTransactionEntity>
{
    public void Configure(EntityTypeBuilder<WalletTransactionEntity> builder)
    {
        builder.ToTable("wallet_transactions")
            .HasKey(x => x.Id);
        
        builder.Property(x => x.Id)
            .HasColumnName("id")
            .ValueGeneratedNever()
            .IsRequired();
    }
}
