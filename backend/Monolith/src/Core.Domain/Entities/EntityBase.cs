namespace Core.Domain.Entities;

public abstract class EntityBase<TId>
{
    protected EntityBase()
    {
        if (typeof(TId) == typeof(Guid))
            Id = (TId)(object)Guid.NewGuid();
    }

    public TId Id { get; protected set; }

    public override bool Equals(object? obj)
    {
        if (obj is not EntityBase<TId> other)
            return false;

        if (ReferenceEquals(this, other))
            return true;

        return EqualityComparer<TId>.Default.Equals(Id, other.Id);
    }

    public override int GetHashCode() => EqualityComparer<TId>.Default.GetHashCode(Id);
}