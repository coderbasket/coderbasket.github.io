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
                _currentItems[SiteInfo.FrameWork] = _items.Shuffle().ToList();
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
                if (_items != null)
                {
                    ItemHasLoaded = true;
                    if (_items.Count > 0)
                    {
                        _currentItems[SiteInfo.FrameWork] = _items;
                        ItemsLoaded?.Invoke(SiteInfo.FrameWork, _items);
                        return;
                    }
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
                    _items = MauiServer.GetProjectItemData().Items;
                }
                if (_items != null && _items.Count > 0)
                {
                    ItemHasLoaded = true;
                    _currentItems[SiteInfo.FrameWork] = _items.Shuffle().ToList();
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
                _items = MauiServer.GetProjectItemData().Items;
            }
            return _items;
        }
        public static ProjectItemData CreateProjectItemData()
        {
            var projectItemData = MauiServer.GetProjectItemData();
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
       
    }
}
