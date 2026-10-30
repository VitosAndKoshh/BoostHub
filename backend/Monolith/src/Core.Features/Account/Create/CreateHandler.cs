using Core.Application.Ports.Persistence.Repositories;
using Core.Application.Results;
using Core.Domain.Entities;
using Core.Features.Customer.Create;
using Microsoft.Extensions.Logging;
using Wolverine;

namespace Core.Features.Account.Create;

public sealed class CreateHandler
{
    private readonly IAccountRepository _accountRepository;
    private readonly IMessageBus _bus;
    private readonly ILogger<CreateHandler> _logger;
    
    public CreateHandler(
        IAccountRepository accountRepository,
        IMessageBus bus,
        ILogger<CreateHandler> logger)
    {
        _accountRepository = accountRepository;
        _bus = bus;
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

        var customerResult = await _bus.InvokeAsync<Result>(
            new CreateCustomerCommand(account.Id),
            cancellationToken);

        if (customerResult.IsFailure)
        {
            _logger.LogWarning(
                "Customer creation failed for account {AccountId}. ErrorCode: {ErrorCode}",
                account.Id,
                customerResult.Error!.Code.Value);
            return customerResult.Error!;
        }
        
        return Result.Success();
    }
}
