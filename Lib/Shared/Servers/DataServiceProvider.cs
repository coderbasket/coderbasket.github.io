using Blazor_App.Shared.Infrastructure;
using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using System.Text.Json;
using System.Linq;
using System.Diagnostics;
using System.Reflection;
using System.Text;
using System.Text.RegularExpressions;
using Blazor_App.Shared.Models;
using Blazor_App.Shared.Enums;
using Blazor_App.Shared.Extensions;
#nullable disable
namespace Blazor_App.Shared.Servers
{

    public class DataServiceProvider
    {
        static bool hostedJson = false;
        public static Dictionary<FrameWork, List<ProjectItem>> _currentItems = new Dictionary<FrameWork, List<ProjectItem>>();
        public static bool NeedUpdate = false;
        public static Random Random = new Random();
        public static bool ItemHasLoaded = false;
        public static event EventHandler<List<ProjectItem>> ItemsLoaded;
        public static List<ProjectItem> CheckItems()
        {
            List<ProjectItem> _items = null;
            if (_currentItems.ContainsKey(SiteInfo.FrameWork))
            {
                _items = _currentItems[SiteInfo.FrameWork];
            }
            return _items;
        }
        public static async Task<ProjectItem> GetProjectItemAsync(string slug)
        {
            var items = await GetItemsAsync();
            return items.Where(p => p.Slug == slug).FirstOrDefault();
        }
        public static async Task<List<ProjectItem>> GetItemsAsync(bool refresh = false)
        {
            List<ProjectItem> _items = null;
            if (refresh == false)
            {
                _items = CheckItems();
                if (_items != null)
                    return _items;
            }
            _items = await GetFromServerAsync();
            if (_items != null && _items.Count > 0)
            {
                _currentItems[SiteInfo.FrameWork] = _items;
                ItemHasLoaded = true;
                ItemsLoaded?.Invoke(true, _items);

            }
            return _items;
        }
        static bool processing = false;
        public async static void LoadDataServerAsync(bool refresh = false)
        {
            List<ProjectItem> _items = null;
            if (refresh == false)
            {
                _items = CheckItems();
                if (_items != null && _items.Count > 0)
                {
                    ItemHasLoaded = true;
                    _currentItems[SiteInfo.FrameWork] = _items;
                    ItemsLoaded?.Invoke(SiteInfo.FrameWork, _items);
                    return;
                }
            }
            if (processing)
                return;
            processing = true;
            
            await Task.Run(async () =>
            {
                if (hostedJson)
                {
                    var url = GetHostUrl(SiteInfo.FrameWork);
                    var txt = await GithubServices.DownloadstringAsync(url);
                    if (string.IsNullOrEmpty(txt) || string.IsNullOrWhiteSpace(txt))
                        return;
                    var projectItemData = Newtonsoft.Json.JsonConvert.DeserializeObject<ProjectItemData>(txt);
                    _items = projectItemData.Items;
                }
                else
                {
                    _items = GetProjectItemData().Items;
                }
                if (_items != null && _items.Count > 0)
                {
                    ItemHasLoaded = true;
                    _currentItems[SiteInfo.FrameWork] = _items;
                    ItemsLoaded?.Invoke(SiteInfo.FrameWork, _items);
                }
            });
            processing = false;
        }
        private static async Task<List<ProjectItem>> GetFromServerAsync()
        {
           
            List<ProjectItem> _items = null;
            if (hostedJson)
            {
                var url = GetHostUrl(SiteInfo.FrameWork);
                var txt = await GithubServices.DownloadstringAsync(url);
                if (string.IsNullOrEmpty(txt) || string.IsNullOrWhiteSpace(txt))
                    return _items;
                var projectItemData = Newtonsoft.Json.JsonConvert.DeserializeObject<ProjectItemData>(txt);
                _items = projectItemData.Items;
            }
            else
            {
                _items = GetProjectItemData().Items;
            }
            return _items;
        }
        public static ProjectItemData CreateProjectItemData()
        {
            var projectItemData = GetProjectItemData();
            return projectItemData;
        }

        static string GetHostUrl(FrameWork frameWork, bool raw = true)
        {
            if (raw)
            {
                return $"https://raw.githubusercontent.com/coderbasket/coderbasket.github.io/development/Host/{frameWork}/codes.json";
            }
            else
            {
                return $"https://github.com/coderbasket/coderbasket.github.io/blob/development/Host/{frameWork}/codes.json";
            }
        }
        public static void PushToServer(ProjectItem snippet, bool update = false)
        {

        }
        static ProjectItemData GetProjectItemData()
        {
            ProjectItemData projectItemData = new ProjectItemData();
            projectItemData.Title = "Maui";
            projectItemData.Items = new List<ProjectItem>()
            {
                new ProjectItem()
                {
                    Title="HackerNews",
                    ProjectUrl = "https://github.com/brminnick/HackerNews",
                    Description = "A .NET MAUI app for displaying the top posts on Hacker News. \nThis app demonstrates how to use IAsyncEnumerable + C# 8.0 to improve performance. Thanks to IAsyncEnumerable, the items are added to the list as soon as they're available making the app feel faster and more responsive.",
                    ImageUrls = new List<string>()
                    {
                        "https://user-images.githubusercontent.com/13558917/66956918-2873bb80-f01a-11e9-839c-6e935c0b606c.gif",
                    }
                },
                new ProjectItem()
                {
                    Title="Weather-'21",
                    ProjectUrl = "https://github.com/davidortinau/WeatherTwentyOne",
                    Description = "A .NET MAUI app for displaying the top posts on Hacker News. \nThis app demonstrates how to use IAsyncEnumerable + C# 8.0 to improve performance. Thanks to IAsyncEnumerable, the items are added to the list as soon as they're available making the app feel faster and more responsive.",
                    Categories = new List<Enums.Category>() { Category.MAPS, Category.WIDGETS },
                    ImageUrls = new List<string>()
                    {
                        "https://raw.githubusercontent.com/davidortinau/WeatherTwentyOne/main/images/maui-weather-hero-sm.png",
                    },

                },
                new ProjectItem()
                {
                    Title="DevExpress Editors for .NET MAUI",
                    ProjectUrl = "https://github.com/DevExpress-Examples/maui-editors-get-started",
                    Description = "This repository contains a demo application that allows you to get started with DevExpress Editors for .NET MAUI.",
                    Categories = new List<Enums.Category>() { Category.WIDGETS, Category.DASHBOARD, Category.NAVIGATIONS, Category.CHARTS, Category.LOGIN, Category.LISTS },
                    ExternalUrl = "https://www.devexpress.com/maui/",
                    ImageUrls = new List<string>()
                    {
                        "https://raw.githubusercontent.com/DevExpress-Examples/maui-editors-get-started/22.1.1%2B/Images/editors-iphone12.png",
                        "https://github.com/DevExpress-Examples/maui-editors-get-started/raw/22.1.1%2B/Images/editors-pixel3a.png"
                    },

                },
                new ProjectItem()
                {
                    Title="Microsoft.Maui.Graphics.Controls: Pixel-Perfect Drawn Controls for .NET MAUI",
                    ProjectUrl = "https://github.com/dotnet/Microsoft.Maui.Graphics.Controls",
                    Description = "Microsoft.Maui.Graphics.Controls is a .NET MAUI experiment that offers cross-platform, pixel-perfect, drawn controls, with three built-in themes: Cupertino, Fluent and Material.",
                    Categories = new List<Enums.Category>() { Category.OTHERS },
                    ImageUrls = new List<string>()
                    {
                        "https://raw.githubusercontent.com/dotnet/Microsoft.Maui.Graphics.Controls/main/images/graphicscontrols-darktheme.gif",
                        "https://raw.githubusercontent.com/dotnet/Microsoft.Maui.Graphics.Controls/main/images/graphicscontrols-rtl.png",
                        "https://github.com/dotnet/Microsoft.Maui.Graphics.Controls/raw/main/images/graphicscontrols-mac.gif"
                    },

                },
                new ProjectItem()
                {
                    Title="DevExpress Stocks App for .NET MAUI",
                    ProjectUrl = "https://github.com/DevExpress-Examples/maui-stocks-mini",
                    Description = "DevExpress Mobile UI allows you to use a .NET cross-platform UI toolkit and C# to build native apps for iOS and Android.",
                     Categories = new List<Enums.Category>() { Category.CHARTS, Category.LISTS, Category.TABBARS, Category.WIDGETS, Category.DASHBOARD},
                    ExternalUrl = "https://www.devexpress.com/maui/",
                    ImageUrls = new List<string>()
                    {
                        "https://github.com/DevExpress-Examples/maui-stocks-mini/raw/22.1.1%2B/Images/stocks-data-pixel5.png",
                        "https://github.com/DevExpress-Examples/maui-editors-get-started/raw/22.1.1%2B/Images/maui.png"
                    },

                },
                new ProjectItem()
                {
                    Title="Chat App - .NET MAUI UI Challenge",
                    ProjectUrl = "https://github.com/jsuarezruiz/netmaui-chat-app-challenge",
                    Description = "Chat App UI Challenge made with .NET MAUI.",
                    Categories = new List<Enums.Category>() { Category.COMMENTS },
                    YoutubeUrl = "https://www.youtube.com/watch?v=xX5xr9JleQM",
                    ImageUrls = new List<string>()
                    {
                        "https://github.com/jsuarezruiz/netmaui-chat-app-challenge/raw/main/images/chatapp-maui.png",
                    },

                },
                new ProjectItem()
                {
                    Title="Rachel's Recipes",
                    ProjectUrl = "https://github.com/rachelkang/recipeSearch",
                    Description = "This app continues to be work-in-progress and at the moment, its primary purpose is to test the accessibility of .NET MAUI.",
                    Categories = new List<Enums.Category>() { Category.STORES, Category.LISTS, Category.PRODUCTS},
                    YoutubeUrl = "",
                    ImageUrls = new List<string>()
                    {
                        "https://github.com/rachelkang/recipeSearch/raw/main/screenshots/screen_starting.png",
                        "https://github.com/rachelkang/recipeSearch/raw/main/screenshots/screen_search_recipes.png",
                        "https://github.com/rachelkang/recipeSearch/raw/main/screenshots/screen_recipe_detail.png",
                        "https://github.com/rachelkang/recipeSearch/raw/main/screenshots/screen_recipes_carousel.png",
                        "https://github.com/rachelkang/recipeSearch/raw/main/screenshots/screen_recipe_detail_saved.png",
                        "https://github.com/rachelkang/recipeSearch/raw/main/screenshots/screen_recipe_detail_edit.png",
                    },

                },
                new ProjectItem()
                {
                    Title="Calculator Sample App",
                    ProjectUrl = "https://github.com/dotnet/maui-samples/tree/main/6.0/Apps/Calculator",
                    Description = "This basic calculator demonstrates using span and spacing features of a Grid layout to achieve a familiar interface.",
                    Categories = new List<Enums.Category>() { Category.STORES, Category.LISTS, Category.PRODUCTS},
                    YoutubeUrl = "",
                    ImageUrls = new List<string>()
                    {
                        "https://github.com/dotnet/maui-samples/raw/main/6.0/Apps/Calculator/images/ios.png",
                        "https://github.com/dotnet/maui-samples/raw/main/6.0/Apps/Calculator/images/macos.png",
                    },

                },
                new ProjectItem()
                {
                    Title=".NET Podcasts - Sample Application",
                    ProjectUrl = "https://github.com/microsoft/dotnet-podcasts",
                    Description = "The .NET Podcast app is a sample application showcasing .NET 6, ASP.NET Core, Blazor, .NET MAUI, Azure Container Apps, Orleans, and more.",
                    Categories = new List<Enums.Category>() { Category.POPOVERS},
                    YoutubeUrl = "",
                    ImageUrls = new List<string>()
                    {
                        "https://github.com/microsoft/dotnet-podcasts/raw/main/docs/net-podcasts.png",

                    },

                },
                new ProjectItem()
                {
                    Title="MauiScientificCalculator (UPDATED TO MAUI GA RELEASE)",
                    ProjectUrl = "https://github.com/naweed/MauiScientificCalculator",
                    Description = "A simple scientific calculator built uisng .NET MAUI Preview 14. Based ont his Behance Concept.",
                    Categories = new List<Enums.Category>() { Category.CALCULATORS},
                    YoutubeUrl = "",
                    ImageUrls = new List<string>()
                    {
                        "https://github.com/naweed/MauiScientificCalculator/raw/main/Behance_Concept.png",
                        "https://github.com/naweed/MauiScientificCalculator/raw/main/SplashScreen.png",
                        "https://github.com/naweed/MauiScientificCalculator/raw/main/CalcScreen.png",
                    },

                },
                new ProjectItem()
                {
                    Title="LiveCharts2",
                    ProjectUrl = "https://github.com/beto-rodriguez/LiveCharts2",
                    Description = "LiveCharts2 (v2) is the evolution of LiveCharts (v0), it fixes the main design issues of its predecessor, it's focused to run everywhere, improves flexibility without losing what we already had in v0.",
                    Categories = new List<Enums.Category>() { Category.CHARTS},
                    YoutubeUrl = "",
                    ImageUrls = new List<string>()
                    {
                        "https://user-images.githubusercontent.com/10853349/124399763-41873900-dce3-11eb-937a-947d66d42597.gif",
                    },

                },
                new ProjectItem()
                {
                    Title="MAUI Beach",
                    ProjectUrl = "https://github.com/irongut/MauiBeach",
                    Description = "A playground for experiments with .Net MAUI, development will be documented on my blog Sailing the Sharp Sea.",
                    Categories = new List<Enums.Category>() { Category.NAVIGATIONS},
                    YoutubeUrl = "",
                    ExternalUrl="https://blog.taranissoftware.com/first-steps-on-maui-beach",
                    ImageUrls = new List<string>()
                    {
                        "https://cdn.hashnode.com/res/hashnode/image/upload/v1638495664862/U7Y79glXG.png?auto=compress,format&format=webp",
                    },

                },
                new ProjectItem()
                {
                    Title="Syncfusion .NET MAUI examples",
                    ProjectUrl = "https://github.com/syncfusion/maui-demos",
                    Description = "This repository contains awesome demos of Syncfusion .NET MAUI controls. This is the best place to check our controls to get more insight about the usage of APIs.",
                    Categories = new List<Enums.Category>() { Category.CHARTS, Category.LISTS, Category.TABBARS, Category.WIDGETS, Category.DASHBOARD},
                    YoutubeUrl = "",
                    ExternalUrl="https://www.syncfusion.com/",
                    ImageUrls = new List<string>()
                    {
                        "https://devblogs.microsoft.com/dotnet/wp-content/uploads/sites/10/2022/05/hero_syncfusion.png",
                    },

                },
                new ProjectItem()
                {
                    Title="Telerik UI for .NET MAUI Sample Applications",
                    ProjectUrl = "https://github.com/telerik/maui-samples",
                    Description = "This repository contains sample applications related to Telerik UI for .NET MAUI components.",
                    Categories = new List<Enums.Category>() { Category.CHARTS, Category.LISTS, Category.TABBARS, Category.WIDGETS, Category.DASHBOARD},
                    YoutubeUrl = "",
                    ExternalUrl="https://docs.telerik.com/devtools/maui/demos-and-sample-apps/",
                    ImageUrls = new List<string>()
                    {
                        "https://github.com/telerik/maui-samples/raw/main/Images/Telerik-UI-For-MAUI-CryptoTracker-Image.png",
                    },

                },
            };
            return projectItemData;
        }
    }
}
