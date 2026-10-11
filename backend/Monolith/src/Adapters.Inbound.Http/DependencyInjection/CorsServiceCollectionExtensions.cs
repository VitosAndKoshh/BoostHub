using Adapters.Inbound.Http.Constants;
using Adapters.Inbound.Http.Options;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Adapters.Inbound.Http.DependencyInjection;

public static class CorsServiceCollectionExtensions
{
    public static IServiceCollection AddAppCors(this IServiceCollection services, IConfiguration configuration)
    {
        var corsOptions = configuration.GetSection(ConfigurationConstants.Cors).Get<CorsOptions>();
        if (corsOptions == null)
            throw new ArgumentNullException(nameof(corsOptions));
        services.AddCors(options =>
        {
            options.AddPolicy(corsOptions.Name, policy =>
            {
                policy
                    .WithOrigins(corsOptions.AllowedHost)
                    .AllowAnyHeader()
                    .AllowAnyMethod();
            });
        });
        return services;
    }
}