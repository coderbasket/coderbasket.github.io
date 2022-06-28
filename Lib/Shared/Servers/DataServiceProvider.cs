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
                    ImageUris = new List<string>()
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
                    ImageUris = new List<string>()
                    {
                        "https://raw.githubusercontent.com/davidortinau/WeatherTwentyOne/main/images/maui-weather-hero-sm.png",
                    },

                },
            };
            return projectItemData;
        }
    }
}
