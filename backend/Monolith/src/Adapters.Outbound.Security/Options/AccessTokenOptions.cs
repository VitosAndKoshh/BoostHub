namespace Adapters.Outbound.Security.Options;

public sealed class AccessTokenOptions
{
    public ushort Lifetime { get; set; }

    public string SecretKey { get; set; } = string.Empty;
}