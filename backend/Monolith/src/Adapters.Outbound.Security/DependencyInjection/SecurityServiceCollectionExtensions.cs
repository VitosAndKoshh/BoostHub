using Adapters.Outbound.Security.Constants;
using Adapters.Outbound.Security.Jwt;
using Adapters.Outbound.Security.Options;
using Adapters.Outbound.Security.Password;
using Core.Application.Ports.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Adapters.Outbound.Security.DependencyInjection;

public static class SecurityServiceCollectionExtensions
{
    public static IServiceCollection AddSecurity(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddCustomAuthentication(configuration);
        services.Configure<AccessTokenOptions>(configuration.GetSection(ConfigurationSections.AccessToken));
    
        services.AddScoped<IJwtProvider, JwtProvider>();
        services.AddScoped<IPasswordHasher, PasswordHasher>();
        return services;
    }
}