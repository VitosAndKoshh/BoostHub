using Core.Abstractions.Errors;

namespace Core.Domain.Exceptions;

public class DomainException : Exception
{
    public Error Error { get; }

    public DomainException(Error error)
        : base(error.Description)
    {
        Error = error;
    }

    protected DomainException(Error error, Exception innerException)
        : base(error.Description, innerException)
    {
        Error = error;
    }
}