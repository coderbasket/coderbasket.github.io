using Blazor_App.Shared;
using Blazor_App.Shared.Servers;
using Blazored.Modal;
using CoderBasket.Blazor;
using CoderBasket.Blazor.Provider;
using Microsoft.AspNetCore.Components;
using Microsoft.AspNetCore.Components.Web;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
var builder = WebAssemblyHostBuilder.CreateDefault(args);
builder.RootComponents.Add<App>("#app");
builder.RootComponents.Add<HeadOutlet>("head::after");
builder.Services.AddBlazoredModal();
builder.Services.AddScoped(sp => new HttpClient { BaseAddress = new Uri(builder.HostEnvironment.BaseAddress) });
builder.Services.AddScoped<UserSettingsProvider>();
DataServiceProvider.LoadDeveloperTools();
var items = await DataServiceProvider.GetItemsAsync();
await builder.Build().RunAsync();


