using Core.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Adapters.Outbound.Postgres.EntityConfigurations;

internal sealed class LocalCredentialEntityConfiguration : IEntityTypeConfiguration<LocalCredentialEntity>
{
    public void Configure(EntityTypeBuilder<LocalCredentialEntity> builder)
    {
        builder.ToTable("local_credentials")
            .HasKey(x => x.Id);
        
        builder.Property(x => x.Id)
            .HasColumnName("id")
            .ValueGeneratedNever()
            .IsRequired();
        
        builder.Property(x => x.Email)
            .HasColumnName("email")
            .IsRequired();
        
        builder.Property(x => x.PasswordHash)
            .HasColumnName("password_hash")
            .IsRequired();
        
        builder.Property(x => x.RoleId)
            .HasColumnName("role_id")
            .IsRequired();
        
        builder.Property(x => x.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();
        
        builder.HasIndex(x => x.Email)
            .IsUnique();
        
        builder.HasOne<RoleEntity>()
            .WithMany()
            .HasForeignKey(x => x.RoleId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
