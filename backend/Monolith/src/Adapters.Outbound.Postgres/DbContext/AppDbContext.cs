using Core.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Adapters.Outbound.Postgres.DbContext;

public sealed class AppDbContext :  Microsoft.EntityFrameworkCore.DbContext
{
    public AppDbContext(DbContextOptions options) : base(options) { }

    public DbSet<AccountEntity> Accounts => Set<AccountEntity>();
    public DbSet<AccountIdentityEntity> AccountIdentities => Set<AccountIdentityEntity>();
    public DbSet<BoostRequestEntity> BoostRequests => Set<BoostRequestEntity>();
    public DbSet<BoostSnapshotEntity> BoostSnapshots => Set<BoostSnapshotEntity>();
    public DbSet<BoosterEntity> Boosters => Set<BoosterEntity>();
    public DbSet<CustomerEntity> Customers => Set<CustomerEntity>();
    public DbSet<GameEntity> Games => Set<GameEntity>();
    public DbSet<LocalCredentialEntity> LocalCredentials => Set<LocalCredentialEntity>();
    public DbSet<OfferEntity> Offers => Set<OfferEntity>();
    public DbSet<OrderEntity> Orders => Set<OrderEntity>();
    public DbSet<RoleEntity> Roles => Set<RoleEntity>();
    public DbSet<TransferEntity> Transfers => Set<TransferEntity>();
    public DbSet<WalletEntity> Wallets => Set<WalletEntity>();
    public DbSet<WalletTransactionEntity> WalletTransactions => Set<WalletTransactionEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}
