using Adapters.Outbound.Postgres.DbContext;
using Core.Abstractions.AggregateRoot;
using Core.Application.Ports.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Adapters.Outbound.Postgres.UnitOfWork;

public class UnitOfWorkBase : IUnitOfWork
{
    private readonly AppDbContext _dbContext;
    //private readonly IDomainEventDispatcher _domainEventDispatcher;
    
    public UnitOfWorkBase(
        AppDbContext dbContext
        //IDomainEventDispatcher domainEventDispatcher
        )
    {
        _dbContext = dbContext;
        //_domainEventDispatcher = domainEventDispatcher;
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken)
    {
        //await DispatchDomainEventsAsync(cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task ExecuteInTransactionAsync(Func<CancellationToken, Task> action, CancellationToken cancellationToken)
    {
        var strategy = _dbContext.Database.CreateExecutionStrategy();

        await strategy.ExecuteAsync(async () =>
        {
            if (_dbContext.Database.CurrentTransaction != null)
            {
                await action(cancellationToken);
                return;
            }

            await using var transaction = await _dbContext.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                await action(cancellationToken);
                await SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);
            }
            catch
            {
                await transaction.RollbackAsync(cancellationToken);
                throw;
            }
        });
    }

    public async Task<T> ExecuteInTransactionAsync<T>(Func<CancellationToken, Task<T>> action, CancellationToken cancellationToken)
    {
        var strategy = _dbContext.Database.CreateExecutionStrategy();

        return await strategy.ExecuteAsync(async () =>
        {
            if (_dbContext.Database.CurrentTransaction != null)
            {
                return await action(cancellationToken);
            }

            await using var transaction = await _dbContext.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                var res = await action(cancellationToken);
                await SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);
                return res;
            }
            catch
            {
                await transaction.RollbackAsync(cancellationToken);
                throw;
            }
        });
    }
    
    // private async Task DispatchDomainEventsAsync(
    //     CancellationToken cancellationToken)
    // {
    //     var aggregates = _dbContext.ChangeTracker
    //         .Entries<IAggregateRoot>()
    //         .Select(x => x.Entity)
    //         .Where(x => x.DomainEvents.Count > 0)
    //         .ToList();
    //
    //     var domainEvents = aggregates
    //         .SelectMany(x => x.DomainEvents)
    //         .ToList();
    //
    //     await _domainEventDispatcher.DispatchAsync(
    //         domainEvents,
    //         cancellationToken);
    //
    //     foreach (var aggregate in aggregates)
    //     {
    //         aggregate.ClearDomainEvents();
    //     }
    // }
}