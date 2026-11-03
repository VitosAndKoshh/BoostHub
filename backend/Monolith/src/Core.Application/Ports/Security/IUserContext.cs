namespace Core.Application.Ports.Security;

public interface IUserContext
{
    bool IsAuthenticated { get; }

    Guid? UserId { get; }
}
