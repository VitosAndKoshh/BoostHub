using Core.Application.Ports.Persistence;
using Core.Application.Ports.Persistence.Repositories;
using Core.Application.Ports.Security;
using Core.Application.Results;
using Core.Domain.Entities;
using Core.Domain.Enums;
using Core.Domain.Errors.Account;
using Core.Domain.Errors.Booster;
using Core.Domain.Errors.User;
using Core.Domain.Errors.UserRole;
using Core.Domain.ValueObjects;
using Microsoft.Extensions.Logging;

namespace Core.Features.Booster.Create;

public sealed class CreateHandler
{
    private readonly IUserRepository _userRepository;
    private readonly IAccountRepository _accountRepository;
    private readonly IRoleRepository _roleRepository;
    private readonly IBoosterRepository _boosterRepository;
    private readonly IBoosterApplicationRepository _applicationRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IUserContext _userContext;
    private readonly ILogger<CreateHandler> _logger;

    public CreateHandler(
        IUserRepository userRepository,
        IAccountRepository accountRepository,
        IRoleRepository roleRepository,
        IBoosterRepository boosterRepository,
        IBoosterApplicationRepository applicationRepository,
        IUnitOfWork unitOfWork,
        IUserContext userContext,
        ILogger<CreateHandler> logger)
    {
        _userRepository = userRepository;
        _accountRepository = accountRepository;
        _roleRepository = roleRepository;
        _boosterRepository = boosterRepository;
        _applicationRepository = applicationRepository;
        _unitOfWork = unitOfWork;
        _userContext = userContext;
        _logger = logger;
    }

    public async Task<Result<CreateResult>> Handle(
        CreateCommand command,
        CancellationToken cancellationToken)
    {
        if (!_userContext.IsAuthenticated || !_userContext.UserId.HasValue)
            return UserRoleErrors.InvalidUserId;

        var userId = _userContext.UserId.Value;

        _logger.LogInformation(
            "Booster creation started for UserId {UserId}",
            userId);

        var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
        if (user is null)
        {
            _logger.LogWarning(
                "Booster creation failed because UserId {UserId} was not found",
                userId);
            return UserErrors.NotFound;
        }

        var account = await _accountRepository.GetByIdentityAsync(
            IdentityProvider.Local,
            userId.ToString(),
            cancellationToken);
        if (account is null)
        {
            _logger.LogWarning(
                "Booster creation failed because no Account was found for UserId {UserId}",
                userId);
            return AccountErrors.NotFound;
        }

        if (account.Status != EntityStatus.Active)
        {
            _logger.LogWarning(
                "Booster creation rejected because AccountId {AccountId} is not active. Status: {Status}",
                account.Id,
                account.Status);
            return AccountErrors.NotActive;
        }

        if (await _boosterRepository.ExistsByAccountIdAsync(account.Id, cancellationToken))
        {
            _logger.LogWarning(
                "Booster creation rejected because Booster already exists for AccountId {AccountId}",
                account.Id);
            return BoosterErrors.AlreadyExists;
        }

        var role = await _roleRepository.GetByNameAsync(AccountRole.Booster, cancellationToken);
        if (role is null)
        {
            _logger.LogError("Booster role was not found while creating a profile for UserId {UserId}", userId);
            return UserErrors.RoleNotFound;
        }

        var discordNickname = DiscordNickname.Create(command.DiscordNickname);
        var booster = BoosterEntity.Create(account.Id, discordNickname);
        var application = BoosterApplicationEntity.Create(booster.Id);

        await _unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            await _boosterRepository.AddAsync(booster, ct);
            await _applicationRepository.AddAsync(application, ct);

            user.AddRole(role.Id);
        }, cancellationToken);

        _logger.LogInformation(
            "Booster and initial application created. UserId {UserId}, AccountId {AccountId}, BoosterId {BoosterId}, ApplicationId {ApplicationId}",
            userId,
            account.Id,
            booster.Id,
            application.Id);

        return new CreateResult(
            booster.Id,
            application.Id,
            application.Status);
    }
}
