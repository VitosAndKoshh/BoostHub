using Core.Domain.Enums;

namespace Core.Domain.Entities;

public sealed class BoostRequestEntity : EntityBase<Guid>
{
    // For EF Core
    private BoostRequestEntity(){}

    private BoostRequestEntity(
        Guid accountId,
        Guid gameId,
        decimal price,
        string? description,
        DateTime endDate)
    {
        AccountId = accountId;
        GameId = gameId;
        Price = price;
        Description = description;
        Status = BoostRequestStatus.Pending;
        EndDate = endDate;
        RequestedAt = DateTime.UtcNow;       
    }
    
    public Guid AccountId { get; init; }
    public Guid GameId { get; init; }
    public decimal Price { get; private set; }
    public string? Description { get; private set; }
    public BoostRequestStatus Status { get; private set; }  
    public DateTime EndDate { get; private set; }   
    public DateTime RequestedAt { get; init; }

    public static BoostRequestEntity Create(Guid accountId, Guid gameId,
        decimal price, string? description, DateTime endDate)
    {
        if (accountId == Guid.Empty)
            
        return new BoostRequestEntity();
    }
}