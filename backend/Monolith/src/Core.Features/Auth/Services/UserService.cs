using Core.Application.Ports.Persistence.Repositories;
using Core.Application.Results;
using Core.Domain.Entities;
using Core.Domain.Errors.Credentials;
using Microsoft.Extensions.Logging;

namespace Core.Features.Auth.Services;

public sealed class UserService
{
    private readonly IUserRepository _userRepository;
    private readonly ILogger<UserService> _logger;
    
    public UserService(IUserRepository userRepository,
        ILogger<UserService> logger)
    {
        _userRepository = userRepository;
        _logger = logger;
    }

    public async Task<Result<LocalCredentialEntity>> GetUserByEmailAsync(string email, CancellationToken cancellationToken)
    {
        var user = await _userRepository.GetByEmailAsync(email, cancellationToken);
        if (user is null)
        {
            _logger.LogWarning("User not found.");
            return CredentialErrors.NotFound;
        }
        return user;
    }
}