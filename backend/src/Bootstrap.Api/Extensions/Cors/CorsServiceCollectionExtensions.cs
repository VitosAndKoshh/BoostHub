using Bootstrap.Api.Constants;
using Bootstrap.Api.Options;

namespace Bootstrap.Api.Extensions.Cors;

internal static class CorsServiceCollectionExtensions
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
    
    public static void UseCorsConfig(this WebApplication app)
    {
        app.UseCors(ConfigurationConstants.Cors);
    }
}