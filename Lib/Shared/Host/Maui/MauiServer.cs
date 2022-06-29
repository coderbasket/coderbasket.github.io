using Blazor_App.Shared.Enums;
using Blazor_App.Shared.Models;
using System;

namespace Blazor_App.Shared
{
    public class MauiServer
    {
        public static ProjectItemData GetProjectItemData()
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
                    Categories = new List<Blazor_App.Shared.Enums.Category>() { Category.MAPS, Category.WIDGETS },
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
                    Categories = new List<Blazor_App.Shared.Enums.Category>() { Category.WIDGETS, Category.DASHBOARD, Category.NAVIGATIONS, Category.CHARTS, Category.LOGIN, Category.LISTS },
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
                    Categories = new List<Category>() { Category.OTHERS },
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
                     Categories = new List<Category>() { Category.CHARTS, Category.LISTS, Category.TABBARS, Category.WIDGETS, Category.DASHBOARD},
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
                    Categories = new List<Category>() { Category.COMMENTS },
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
                    Categories = new List<Category>() { Category.STORES, Category.LISTS, Category.PRODUCTS},
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
                    ProjectUrl = "https://github.com/dotnet/maui-samples",
                    Description = "This basic calculator demonstrates using span and spacing features of a Grid layout to achieve a familiar interface.",
                    Categories = new List<Category>() { Category.STORES, Category.LISTS, Category.PRODUCTS},
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
                    Categories = new List<Blazor_App.Shared.Enums.Category>() { Category.POPOVERS},
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
                    Categories = new List<Blazor_App.Shared.Enums.Category>() { Category.CALCULATORS},
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
                    Categories = new List<Category>() { Category.CHARTS},
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
                    Categories = new List<Category>() { Category.NAVIGATIONS},
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
                    Categories = new List<Category>() { Category.CHARTS, Category.LISTS, Category.TABBARS, Category.WIDGETS, Category.DASHBOARD},
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
                    Categories = new List<Category>() { Category.CHARTS, Category.LISTS, Category.TABBARS, Category.WIDGETS, Category.DASHBOARD},
                    YoutubeUrl = "",
                    ExternalUrl="https://docs.telerik.com/devtools/maui/demos-and-sample-apps/",
                    ImageUrls = new List<string>()
                    {
                        "https://github.com/telerik/maui-samples/raw/main/Images/Telerik-UI-For-MAUI-CryptoTracker-Image.png",
                    },

                },
                new ProjectItem()
                {
                    Title="BirdAtlas",
                    ProjectUrl = "https://github.com/AppCreativity/BirdAtlas",
                    Description = "Based upon Dribbble project created by Monika Michalczyk",
                    Categories = new List<Category>() {Category.WIDGETS},
                    YoutubeUrl = "",
                    ExternalUrl="",
                    ImageUrls = new List<string>()
                    {
                        "https://camo.githubusercontent.com/69a9af18e718de66d5c72581ed91e52b80a765ceab3f26cf8186bf795786d768/68747470733a2f2f63646e2e6472696262626c652e636f6d2f75736572732f313136383533392f73637265656e73686f74732f353434323835302f6672616d655f5f325f2e706e67",
                    },

                },
            };
            return projectItemData;
        }
    }
}
