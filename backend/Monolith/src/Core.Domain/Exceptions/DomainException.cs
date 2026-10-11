using System;
using Core.Abstractions.Errors;

namespace Core.Domain.Exceptions;

public class DomainException : Exception
{
    public Error Error { get; }

    public DomainException(string message, Error error)
        : base(message)
    {
        Error = error;
    }

    protected DomainException(string message, Error error, Exception innerException)
        : base(message, innerException)
    {
        Error = error;
    }
}