using Bootstrap.Api.Extensions.Common;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddApplicationBuilder(builder.Configuration);

var app = builder.Build();

await app.ConfigureAsync();

app.Run();