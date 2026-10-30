using Core.Application.Ports.Persistence;
using Core.Application.Ports.Persistence.Repositories;
using Core.Application.Results;
using Core.Domain.Entities;
using Microsoft.Extensions.Logging;

namespace Core.Features.Account.Create;

public sealed class CreateHandler
{
    private readonly IAccountRepository _accountRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<CreateHandler> _logger;
    
    public CreateHandler(
        IAccountRepository accountRepository,
        IUnitOfWork unitOfWork,
        ILogger<CreateHandler> logger)
    {
        _accountRepository = accountRepository;
        _unitOfWork = unitOfWork;
        _logger = logger;  
    }

    public async Task<Result> Handle(CreateCommand command, CancellationToken cancellationToken)
    {
        var account = AccountEntity.Create(null);
        var accountIdentity = AccountIdentityEntity.Create(
            account.Id,
            command.Provider,
            command.ProviderUserId.ToString());
        account.AddIdentity(accountIdentity);
        await _accountRepository.AddAsync(account, cancellationToken);
        
        return Result.Success();
    }
}