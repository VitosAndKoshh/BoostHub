using Core.Application.Ports.Persistence;
using Core.Application.Ports.Persistence.Repositories;
using Core.Application.Ports.Security;
using Core.Application.Results;
using Core.Domain.Entities;
using Core.Domain.Enums;
using Core.Domain.Errors.User;
using Core.Domain.ValueObjects;
using Microsoft.Extensions.Logging;

namespace Core.Features.Auth.Register;

public sealed class RegisterHandler
{
    private readonly IUserRepository _userRepository;
    private readonly IRoleRepository _roleRepository;
    private readonly IAccountRepository _accountRepository;
    private readonly ICustomerRepository _customerRepository;
    private readonly IWalletRepository _walletRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtProvider _jwtProvider;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<RegisterHandler> _logger;
    public RegisterHandler(IUserRepository userRepository,
        IRoleRepository roleRepository,
        IAccountRepository accountRepository,
        ICustomerRepository customerRepository,
        IWalletRepository walletRepository,
        IPasswordHasher passwordHasher,
        IJwtProvider jwtProvider,
        IUnitOfWork unitOfWork,
        ILogger<RegisterHandler> logger)
    {
        _userRepository = userRepository;
        _roleRepository = roleRepository;
        _accountRepository = accountRepository;
        _customerRepository = customerRepository;
        _walletRepository = walletRepository;
        _passwordHasher = passwordHasher;
        _jwtProvider = jwtProvider;
        _unitOfWork = unitOfWork;
        _logger = logger;   
    }
    
    public async Task<Result<RegisterResult>> Handle(RegisterCommand command, CancellationToken cancellationToken)
    {
        var alreadyExists = await _userRepository.IsEmailExistsAsync(command.Email, cancellationToken);
        if (alreadyExists)
        {
            _logger.LogWarning(
                "Registration failed because a user with email {Email} already exists.",
                command.Email);
            return UserErrors.AlreadyExists;
        }
        
        const AccountRole roleName = AccountRole.Consumer;
        var role = await _roleRepository.GetByNameAsync(roleName, cancellationToken);
        if (role is null)
        {
            _logger.LogWarning("Role not found. Name: {Name}", roleName);
            return UserErrors.InvalidRole;
        }
        
        var hashedPasswordResult = _passwordHasher.HashPassword(command.Password);
        if (hashedPasswordResult.IsFailure)
            return hashedPasswordResult.Error!;

        var hashedPassword = hashedPasswordResult.Value!;
        
        var user = UserEntity.Create(command.Email, hashedPassword);
        user.AddRole(role.Id);
        
        var account = AccountEntity.Create();
        var accountIdentity = AccountIdentityEntity.Create(
            account.Id,
            IdentityProvider.Local,
            user.Id.ToString());
        account.AddIdentity(accountIdentity);
        
        var customer = CustomerEntity.Create(account.Id);
        var wallet = WalletEntity.Create(account.Id);

        await _unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            await _userRepository.AddAsync(user, ct);
            await _accountRepository.AddAsync(account, ct);
            await _customerRepository.AddAsync(customer, ct);
            await _walletRepository.AddAsync(wallet, ct);
        }, cancellationToken);

        var token = _jwtProvider.Generate(user.Id, [role.Name]);
        var result = new RegisterResult(token);
        return result;
    }
}
