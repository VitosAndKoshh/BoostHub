using Core.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Adapters.Outbound.Postgres.EntityConfigurations;

internal sealed class BoostRequestEntityConfiguration : IEntityTypeConfiguration<BoostRequestEntity>
{
    public void Configure(EntityTypeBuilder<BoostRequestEntity> builder)
    {
        builder.ToTable("boost_requests")
            .HasKey(x => x.Id);
        
        builder.Property(x => x.Id)
            .HasColumnName("id")
            .ValueGeneratedNever()
            .IsRequired();
        
        builder.Property(x => x.CustomerId)
            .HasColumnName("customer_id")
            .IsRequired();
        
        builder.Property(x => x.GameId)
            .HasColumnName("game_id")
            .IsRequired();
        
        builder.Property(x => x.Description)
            .HasColumnName("description")
            .IsRequired();
        
        builder.Property(x => x.RequestedAt)
            .HasColumnName("requested_at")
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

        builder.HasOne<CustomerEntity>()
            .WithMany()
            .HasForeignKey(x => x.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);
        
        builder.HasOne<GameEntity>()
            .WithMany()
            .HasForeignKey(x => x.GameId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
