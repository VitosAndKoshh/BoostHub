using Core.Application.Ports.Persistence.Repositories;
using Core.Application.Ports.Security;
using Core.Application.Results;
using Core.Domain.Errors.Credentials;
using Core.Features.Auth.Services;
using Microsoft.Extensions.Logging;

namespace Core.Features.Auth.Login;

public sealed class LoginHandler
{
    private readonly IRoleRepository _roleRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly UserService _userService;
    private readonly IJwtProvider _jwtProvider;
    private readonly ILogger<LoginHandler> _logger;
    
    public LoginHandler(
        IRoleRepository roleRepository,
        IPasswordHasher passwordHasher,
        UserService userService,
        IJwtProvider jwtProvider,
        ILogger<LoginHandler> logger)
    {
        _roleRepository = roleRepository;
        _passwordHasher = passwordHasher;
        _userService = userService;
        _jwtProvider = jwtProvider;
        _logger = logger;   
    }

    public async Task<Result<LoginResult>> Handle(LoginCommand command, CancellationToken cancellationToken)
    {
        var userResult = await _userService.GetUserByEmailAsync(command.Email, cancellationToken);
        if (userResult.IsFailure)
            return CredentialErrors.NotFound;
        var user = userResult.Value!;
        
        var verifyPasswordResult = _passwordHasher.VerifyHashedPassword(command.Password, user.PasswordHash);
        if (verifyPasswordResult.IsFailure)
        {
            _logger.LogWarning("Password verification failed. UserId: {UserId}", user.Id);
            return verifyPasswordResult.Error!;
        }
        
        var role = await _roleRepository.GetByIdAsync(user.RoleId, cancellationToken);
        if (role is null)
        {
            _logger.LogWarning("Role not found. RoleId: {RoleId}", user.RoleId);
            return CredentialErrors.InvalidRole;
        }

        var token = _jwtProvider.Generate(user.Id, user.RoleId.ToString());
        var result = new LoginResult(token);
        return result;
    }
}