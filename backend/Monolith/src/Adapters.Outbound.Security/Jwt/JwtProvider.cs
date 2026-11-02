using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Adapters.Outbound.Security.Options;
using Core.Application;
using Core.Application.Ports.Security;
using Core.Domain.Enums;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace Adapters.Outbound.Security.Jwt;

public class JwtProvider : IJwtProvider
{
    private readonly AccessTokenOptions _accessOptions;

    public JwtProvider(
        IOptions<AccessTokenOptions> accessOptions)
    {
        _accessOptions = accessOptions.Value;
    }

    public string Generate(Guid userId, IEnumerable<AccountRole> roleNames)
    {
        var claims = new List<Claim>
        {
            new(JwtClaims.Subject, userId.ToString())
        };
        
        claims.AddRange(roleNames
            .Distinct()
            .Select(role => new Claim(JwtClaims.Role, role.ToString())));

        var signingCredentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_accessOptions.SecretKey)),
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: null,
            audience: null,
            signingCredentials: signingCredentials,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(_accessOptions.Lifetime),
            notBefore: null
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}