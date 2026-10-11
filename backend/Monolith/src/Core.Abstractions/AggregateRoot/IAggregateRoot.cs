using Core.Abstractions.Events;

namespace Core.Abstractions.AggregateRoot;

public interface IAggregateRoot
{
    IReadOnlyCollection<IDomainEvent> DomainEvents { get; }
    void ClearDomainEvents();
}