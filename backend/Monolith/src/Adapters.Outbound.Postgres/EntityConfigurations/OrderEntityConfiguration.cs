using Core.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Adapters.Outbound.Postgres.EntityConfigurations;

internal sealed class OrderEntityConfiguration : IEntityTypeConfiguration<OrderEntity>
{
    public void Configure(EntityTypeBuilder<OrderEntity> builder)
    {
        builder.ToTable("orders")
            .HasKey(x => x.Id);
        
        builder.Property(x => x.Id)
            .HasColumnName("id")
            .ValueGeneratedNever()
            .IsRequired();
        
        builder.Property(x => x.OfferId)
            .HasColumnName("offer_id")
            .IsRequired();
        
        builder.Property(x => x.CustomerId)
            .HasColumnName("customer_id")
            .IsRequired();
        
        builder.Property(x => x.BoosterId)
            .HasColumnName("booster_id")
            .IsRequired();
        
        builder.Property(x => x.CreatedAt)
            .HasColumnName("created_at")
            .IsRequired();
        
        builder.Property(x => x.StartedAt)
            .HasColumnName("started_at");
        
        builder.Property(x => x.SubmittedForConfirmationAt)
            .HasColumnName("submitted_for_confirmation_at");
        
        builder.Property(x => x.DisputedAt)
            .HasColumnName("disputed_at");
        
        builder.Property(x => x.CompletedAt)
            .HasColumnName("completed_at");
        
        builder.Property(x => x.CancelledAt)
            .HasColumnName("cancelled_at");
        
        builder.Property(x => x.Status)
            .HasColumnName("status")
            .HasConversion<string>()
            .IsRequired();

        builder.OwnsOne(x => x.AgreedPrice, price =>
        {
            price.Property(x => x.Amount)
                .HasColumnName("agreed_price_amount")
                .IsRequired();
        });
        builder.OwnsOne(x => x.MaxCompletionDuration, duration =>
        {
            duration.Property(x => x.Value)
                .HasColumnName("max_completion_duration")
                .IsRequired();
        });

        builder.HasOne<OfferEntity>()
            .WithMany()
            .HasForeignKey(x => x.OfferId)
            .OnDelete(DeleteBehavior.Restrict);
        
        builder.HasOne<CustomerEntity>()
            .WithMany()
            .HasForeignKey(x => x.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);
        
        builder.HasOne<BoosterEntity>()
            .WithMany()
            .HasForeignKey(x => x.BoosterId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
