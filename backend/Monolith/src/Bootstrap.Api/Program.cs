using Bootstrap.Api.Extensions;
using Core.Features;

var builder = WebApplication.CreateBuilder(args);

var featuresAssembly = typeof(FeaturesAssemblyMarker).Assembly;

builder.Services.AddApplicationBuilder(builder.Configuration, featuresAssembly);

var app = builder.Build();

await app.Configure(featuresAssembly);

await app.RunAsync();