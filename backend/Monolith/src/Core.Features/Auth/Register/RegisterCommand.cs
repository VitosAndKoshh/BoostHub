namespace Core.Features.Auth.Register;

public sealed record RegisterCommand(string Email, string Password);