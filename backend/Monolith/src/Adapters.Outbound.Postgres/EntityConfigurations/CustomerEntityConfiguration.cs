using Core.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Adapters.Outbound.Postgres.EntityConfigurations;

internal sealed class CustomerEntityConfiguration : IEntityTypeConfiguration<CustomerEntity>
{
    public void Configure(EntityTypeBuilder<CustomerEntity> builder)
    {
        builder.ToTable("customers")
            .HasKey(x => x.Id);
        
        builder.Property(x => x.Id)
            .HasColumnName("id")
            .ValueGeneratedNever()
            .IsRequired();
        
        builder.Property(x => x.AccountId)
            .HasColumnName("account_id")
            .IsRequired();
        
        builder.HasIndex(x => x.AccountId)
            .IsUnique();
        
        builder.HasOne<AccountEntity>()
            .WithMany()
            .HasForeignKey(x => x.AccountId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
