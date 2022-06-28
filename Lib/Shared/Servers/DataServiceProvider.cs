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
#nullable disable
namespace Blazor_App.Shared.Servers
{

    public class DataServiceProvider
    {
        public static Dictionary<FrameWork, List<ProjectItem>> _currentItems = new Dictionary<FrameWork, List<ProjectItem>>();
        public static bool NeedUpdate = false;
        public static Random Random = new Random();

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
            return _items;
        }

        private static async Task<List<ProjectItem>> GetFromServerAsync()
        {
            //var url = GetHostUrl(SiteInfo.FrameWork);
            //var txt = await GithubServices.DownloadstringAsync(url);
            //if (string.IsNullOrEmpty(txt) || string.IsNullOrWhiteSpace(txt))
            //    return new List<ProjectItem>();
            //var projectItemData =  Newtonsoft.Json.JsonConvert.DeserializeObject<ProjectItemData>(txt);
            //_currentItems[SiteInfo.FrameWork] = projectItemData.Items;

            var projectItemData = GetProjectItemData();
            return projectItemData.Items;
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
                    Categories = new List<Enums.Category>() { Category.CHARTS },
                    ImageUrls = new List<string>()
                    {
                        "https://github.com/DevExpress-Examples/maui-stocks-mini/raw/22.1.1%2B/Images/stocks-data-pixel5.png",
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
            };
            return projectItemData;
        }
    }
}
