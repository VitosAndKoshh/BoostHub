using System.Text;
using System.Text.Json;
using Adapters.Outbound.Security.Constants;
using Adapters.Outbound.Security.Options;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

namespace Adapters.Outbound.Security.DependencyInjection;

internal static class JwtServiceCollectionExtensions
{
    public static AuthenticationBuilder AddJwtConfiguration(this AuthenticationBuilder builder,
        IConfiguration configuration)
    {
        var accessTokenOptions = configuration.
            GetSection(ConfigurationSections.AccessToken)
            .Get<AccessTokenOptions>();

        if (accessTokenOptions == null || string.IsNullOrEmpty(accessTokenOptions.SecretKey))
            throw new ArgumentException("JWT options are not configured properly.");
        
        builder.AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = false,
                    ValidateAudience = false,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ClockSkew = TimeSpan.Zero,
                    IssuerSigningKey = new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(accessTokenOptions.SecretKey))
                };
                options.Events = new JwtBearerEvents
                {
                    OnAuthenticationFailed = context =>
                    {
                        if (context.Exception is SecurityTokenExpiredException)
                        {
                            context.Response.StatusCode = 401;
                            context.Response.ContentType = "application/json";

                            return context.Response.WriteAsync(JsonSerializer.Serialize(new
                            {
                                message = "Access token expired",
                                code = "TOKEN_EXPIRED"
                            }));
                        }

                        return Task.CompletedTask;
                    },

                    OnChallenge = context =>
                    {
                        if (context.Response.HasStarted)
                            return Task.CompletedTask;

                        context.HandleResponse();

                        context.Response.StatusCode = 401;
                        context.Response.ContentType = "application/json";

                        return context.Response.WriteAsync(JsonSerializer.Serialize(new
                        {
                            message = "Unauthorized",
                            code = "UNAUTHORIZED"
                        }));
                    }
                };
            });
        return builder;
    }
}