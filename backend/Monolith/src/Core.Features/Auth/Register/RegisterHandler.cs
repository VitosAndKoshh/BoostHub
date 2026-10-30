using Core.Application.Ports.Persistence;
using Core.Application.Ports.Persistence.Repositories;
using Core.Application.Ports.Security;
using Core.Application.Results;
using Core.Domain.Entities;
using Core.Domain.Enums;
using Core.Domain.Errors.Credentials;
using Core.Domain.ValueObjects;
using Core.Features.Account.Create;
using Microsoft.Extensions.Logging;
using Wolverine;

namespace Core.Features.Auth.Register;

public sealed class RegisterHandler
{
    private readonly IUserRepository _userRepository;
    private readonly IRoleRepository _roleRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IMessageBus _bus;
    private readonly IJwtProvider _jwtProvider;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<RegisterHandler> _logger;
    
    public RegisterHandler(IUserRepository userRepository,
        IRoleRepository roleRepository,
        IPasswordHasher passwordHasher,
        IMessageBus bus,
        IJwtProvider jwtProvider,
        IUnitOfWork unitOfWork,
        ILogger<RegisterHandler> logger)
    {
        _userRepository = userRepository;
        _roleRepository = roleRepository;
        _passwordHasher = passwordHasher;
        _bus = bus;
        _jwtProvider = jwtProvider;
        _unitOfWork = unitOfWork;
        _logger = logger;   
    }
    
    public async Task<Result<RegisterResult>> Handle(RegisterCommand command, CancellationToken cancellationToken)
    {
        var alreadyExists = await _userRepository.IsEmailExistsAsync(command.Email, cancellationToken);
        if (alreadyExists)
        {
            _logger.LogWarning("User already exists.");
            return CredentialErrors.AlreadyExists;
        }
        
        var roleName = nameof(AccountRole.Consumer);
        var role = await _roleRepository.GetByNameAsync(roleName, cancellationToken);
        if (role is null)
        {
            _logger.LogWarning("Role not found. Name: {Name}", roleName);
            return CredentialErrors.InvalidRole;
        }
        
        var hashedPasswordResult = _passwordHasher.HashPassword(command.Password);
        if (hashedPasswordResult.IsFailure)
            return hashedPasswordResult.Error!;

        var hashedPassword = hashedPasswordResult.Value!;
        
        var user = LocalCredentialEntity.Create(command.Email, hashedPassword, role.Id);
        var transactionResult = await _unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            await _userRepository.AddAsync(user, ct);
            var createCommand = new CreateCommand(IdentityProvider.Local, user.Id);
            var createResult = await _bus.InvokeAsync<Result>(createCommand, ct);
            return createResult;
        }, cancellationToken);

        if (transactionResult.IsFailure)
            return transactionResult.Error!;
        
        var token = _jwtProvider.Generate(user.Id, role.Name.ToString());
        var result = new RegisterResult(token);
        return result;
    }
}