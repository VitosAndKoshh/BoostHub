using System.Reflection;
using JasperFx.CodeGeneration.Model;
using Microsoft.Extensions.DependencyInjection;
using Wolverine;
using Wolverine.FluentValidation;

namespace Core.Application.DependencyInjection;

public static class ApplicationServiceCollectionExtensions
{
    public static IServiceCollection AddApplication(this IServiceCollection services, Assembly assembly)
    {
        services.AddWolverine(options =>
        {
            options.Discovery.IncludeAssembly(assembly);
            options.ServiceLocationPolicy = ServiceLocationPolicy.AlwaysAllowed;
            options.UseFluentValidation();
            options.UseRuntimeCompilation();
        });
        return services;
    }
}