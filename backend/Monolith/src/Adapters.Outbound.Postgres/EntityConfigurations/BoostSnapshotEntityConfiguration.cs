using Core.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Adapters.Outbound.Postgres.EntityConfigurations;

internal sealed class BoostSnapshotEntityConfiguration : IEntityTypeConfiguration<BoostSnapshotEntity>
{
    public void Configure(EntityTypeBuilder<BoostSnapshotEntity> builder)
    {
        builder.ToTable("boost_snapshots")
            .HasKey(x => x.Id);
        
        builder.Property(x => x.Id)
            .HasColumnName("id")
            .ValueGeneratedNever()
            .IsRequired();
        
        builder.Property(x => x.OrderId)
            .HasColumnName("order_id")
            .IsRequired();
        
        builder.Property(x => x.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();

        builder.OwnsOne(x => x.Rating, rating =>
        {
            rating.Property(x => x.Value)
                .HasColumnName("rating_value")
                .IsRequired();
            
            rating.Property(x => x.Unit)
                .HasColumnName("rating_unit")
                .HasConversion<string>()
                .IsRequired();
        });

        builder.HasOne<OrderEntity>()
            .WithMany()
            .HasForeignKey(x => x.OrderId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
