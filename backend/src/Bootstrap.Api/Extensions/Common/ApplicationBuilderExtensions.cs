using Bootstrap.Api.Extensions.Cors;
using Bootstrap.Api.Extensions.Swagger;

namespace Bootstrap.Api.Extensions.Common;

internal static class ApplicationBuilderExtensions
{
    public static async Task ConfigureAsync(this WebApplication app)
    {
        if (app.Environment.IsDevelopment())
        {
            app.UseSwaggerConfig();
        }
        
        //app.UseCorsConfig();

        //app.UseMiddleware<ExceptionHandlingMiddleware>();

        app.UseAuthentication();

        app.UseAuthorization();

        //app.MapControllers();
    }
}