using Core.Domain.ValueObjects;

namespace Core.Features.Account.Create;

public sealed record CreateCommand(IdentityProvider Provider, Guid ProviderUserId);