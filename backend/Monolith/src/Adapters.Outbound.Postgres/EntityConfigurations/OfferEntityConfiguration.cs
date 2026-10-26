using Core.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Adapters.Outbound.Postgres.EntityConfigurations;

internal sealed class OfferEntityConfiguration : IEntityTypeConfiguration<OfferEntity>
{
    public void Configure(EntityTypeBuilder<OfferEntity> builder)
    {
        builder.ToTable("offers")
            .HasKey(x => x.Id);
        
        builder.Property(x => x.Id)
            .HasColumnName("id")
            .ValueGeneratedNever()
            .IsRequired();
        
        builder.Property(x => x.BoostRequestId)
            .HasColumnName("boost_request_id")
            .IsRequired();
        
        builder.Property(x => x.BoosterId)
            .HasColumnName("booster_id")
            .IsRequired();
        
        builder.Property(x => x.Description)
            .HasColumnName("description")
            .IsRequired();
        
        builder.Property(x => x.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();
        
        builder.Property(x => x.Status)
            .HasColumnName("status")
            .HasConversion<string>()
            .IsRequired();

        builder.OwnsOne(x => x.Price, price =>
        {
            price.Property(x => x.Amount)
                .HasColumnName("price_amount")
                .IsRequired();
        });
        builder.OwnsOne(x => x.MaxCompletionDuration, duration =>
        {
            duration.Property(x => x.Value)
                .HasColumnName("max_completion_duration")
                .IsRequired();
        });

        builder.HasOne<BoostRequestEntity>()
            .WithMany()
            .HasForeignKey(x => x.BoostRequestId)
            .OnDelete(DeleteBehavior.Cascade);
        
        builder.HasOne<BoosterEntity>()
            .WithMany()
            .HasForeignKey(x => x.BoosterId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
