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
#nullable disable
namespace Blazor_App.Shared.Servers
{

    public class DataServiceProvider
    {
        public static Dictionary<FrameWork, List<ProjectItem>> _currentItems = new Dictionary<FrameWork, List<ProjectItem>>();
        public static bool NeedUpdate = false;
        public static Random Random = new Random();
        public DataServiceProvider()
        {

        }
        
        public static List<ProjectItem> CheckItems()
        {
            List<ProjectItem> _items = null;
            if (_currentItems.ContainsKey(SiteInfo.FrameWork))
            {
                _items = _currentItems[SiteInfo.FrameWork];
            }
            return _items;
        }
        private static void SetItems(List<ProjectItem> items)
        {
            _currentItems[SiteInfo.FrameWork] = items;
        }
        public async Task<List<ProjectItem>> GetItemsAsync(bool refresh = false)
        {
            List<ProjectItem> _items = null;
            if (refresh == false)
            {
                _items = CheckItems();
                if (_items != null)
                    return _items;
            }

#if (DEBUG)
            //_items = GetSampleItems();
            _items = await GetFromServerAsync();
            SetItems(_items);
            //PushToServer(_items, true);
#else
            _items = await GetFromServerAsync();
            SetItems(_items);
#endif

            return _items;
        }
        public static string _token = "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";
        const string _settings_url = "https://raw.githubusercontent.com/nextcodelab/data-base-server/main/host_data/codes/codes_data_settings.json";
        static GitHubSettings settings = null;
        private static async Task<List<ProjectItem>> GetFromServerAsync()
        {
            var timer = new Stopwatch();
            timer.Start();
            var list = new List<ProjectItem>();
            if (settings == null)
            {
                var set_txt = await GithubServices.DownloadStringAsync(_settings_url);
                if (!string.IsNullOrEmpty(set_txt) && !string.IsNullOrWhiteSpace(set_txt))
                {
                    settings = System.Text.Json.JsonSerializer.Deserialize<GitHubSettings>(set_txt);
                }
            }

            if (settings == null)
                return list;

            var allUrl = GitHubSettings.AllItemsUrl(settings);
            var allGitHub = GithubServices.GetExtractGithubInfo(allUrl, _token);
            var allList = await DeserializeUrlAsync(allGitHub.RawUrl);
            if (allList?.Count > 0 && NeedUpdate == false)
            {
                list = allList;
                foreach (var item in list)
                {
                    
                    item.FrameWorkName = SiteInfo.FrameWork.ToString();
                    if (item.GitHubRepoInfo != null)
                    {
                        if(string.IsNullOrEmpty(item.ProjectUrl))
                            item.ProjectUrl = "https://github.com/" + item.GitHubRepoInfo.GitHubRepoName;

                    }
                }
                //GithubServices.UpdateContentAsync(allGitHub, SiteInfo.FrameWork + " : " + DateTime.UtcNow, SerializeObject(list));
            }
            else
            {
                int num = 1;
                foreach (var cat in settings.Categories.Split(','))
                {
                    var category = cat.Trim();
                    var url = GitHubSettings.PlatformUrl(settings) + category + ".json";
                    var githubInfo = GithubServices.GetExtractGithubInfo(url, _token, category + ".json");
                    var items = await DeserializeUrlAsync(githubInfo.RawUrl);
                    if (items != null)
                    {
                        foreach (var item in items)
                        {
                            
                            item.FrameWorkName = SiteInfo.FrameWork.ToString();
                            if (item.GitHubRepoInfo != null)
                            {
                                if (string.IsNullOrEmpty(item.ProjectUrl))
                                    item.ProjectUrl = "https://github.com/" + item.GitHubRepoInfo.GitHubRepoName;

                            }
                        }
                        
                        list.AddRange(items);
                    }
                    num++;
                }
                if (list?.Count > 0)
                {
                    list = list.GroupBy(p => p.Description).Select(g => g.First()).ToList();
                    GithubServices.UpdateContentAsync(allGitHub, SiteInfo.FrameWork + " : " + DateTime.UtcNow, SerializeObject(list));
                }
                for (int i = 0; i < 5; i++)
                {
                    System.Diagnostics.Debug.WriteLine("-----------------------------------");
                }
                System.Diagnostics.Debug.WriteLine(timer.Elapsed);
                for (int i = 0; i < 5; i++)
                {
                    System.Diagnostics.Debug.WriteLine("-----------------------------------");
                }
            }
            return list;
        }
        static List<FrameWork> AlreadyPushed = new List<FrameWork>()
        {
            FrameWork.Maui,
            FrameWork.Flutter,
            FrameWork.Xamarin ,
            FrameWork.Blazor,
        };
        public static async void PushToServer(ProjectItem snippet, bool update = false)
        {
            if (string.IsNullOrEmpty(snippet.ProjectUrl)
               
                || snippet.ImageUris?.Count() == 0
                || string.IsNullOrEmpty(snippet.FrameWorkName))
            {
                throw new Exception("Check url or maincategory");
            }

            ProjectItem item = null;
            var frame = (FrameWork)Enum.Parse(typeof(FrameWork), snippet.FrameWorkName);
            bool hasItems = false;
            if (_currentItems.ContainsKey(frame))
            {
                item = _currentItems[frame].Where(p => p.ProjectUrl == snippet.ProjectUrl).FirstOrDefault();
                hasItems = true;
            }
            if (item != null && update == false)
                return;
            if (item != null)
            {
                var index = _currentItems[frame].IndexOf(item);
                if(item.ImageUris?.Count() > 0)
                {
                    var imgs = item.ImageUris.ToList();
                    imgs.AddRange(snippet.ImageUris);
                    imgs = imgs.Distinct().ToList();
                    snippet.ImageUris = imgs;
                }
                _currentItems[frame].Remove(item);
                _currentItems[frame].Insert(index, snippet);
            }
            else
            {
                if (hasItems)
                {
                    _currentItems[frame].Add(snippet);
                }
                else
                {
                    _currentItems[frame] = new List<ProjectItem> { snippet };
                }
            }
            if (settings == null)
            {
                var g_data = await GithubServices.DownloadStringAsync(_settings_url);
                settings = System.Text.Json.JsonSerializer.Deserialize<GitHubSettings>(g_data);
            }
            var url = GitHubSettings.PlatformUrl(settings, frame) + ".json";
            var githubInfo = GithubServices.GetExtractGithubInfo(url, _token, frame + ".json");
            var checkUrl = await GithubServices.DownloadStringAsync(githubInfo.RawUrl);
            bool needUpdate = false;
            string uploadJson = null;
            if (checkUrl != null)
            {
                uploadJson = System.Text.Json.JsonSerializer.Serialize(_currentItems[frame]);
                if (uploadJson != checkUrl)
                    needUpdate = true;
            }
            else
            {
                uploadJson = System.Text.Json.JsonSerializer.Serialize(_currentItems[frame]);
                needUpdate = true;
            }
            if (string.IsNullOrEmpty(uploadJson) || string.IsNullOrWhiteSpace(uploadJson))
                return;
            GithubServices.UpdateContentAsync(githubInfo, snippet.FrameWorkName + " : " + DateTime.Now.ToString(), uploadJson);
            System.Diagnostics.Debug.WriteLine("-----------------------------------");
            System.Diagnostics.Debug.WriteLine(SerializeObject(snippet));
            System.Diagnostics.Debug.WriteLine("-----------------------------------");
        }
        private static async void PushToServer(List<ProjectItem> items, bool forceUpdate = false)
        {
            if (forceUpdate == false)
            {
                if (AlreadyPushed.Contains(SiteInfo.FrameWork))
                    return;
            }
            if (settings == null)
            {
                var g_data = await GithubServices.DownloadstringAsync(_settings_url);
                settings = System.Text.Json.JsonSerializer.Deserialize<GitHubSettings>(g_data);
            }
            int num = 1;
            foreach (var cat in settings.Categories.Split(','))
            {
                var category = cat.Trim();
                var url = GitHubSettings.PlatformUrl(settings) + category + ".json";
                var githubInfo = GithubServices.GetExtractGithubInfo(url, _token, category + ".json");
                var checkUrl = await GithubServices.DownloadstringAsync(githubInfo.RawUrl);
                bool update = false;
                if (forceUpdate)
                {
                    update = true;
                }
                else
                {
                    if (checkUrl == null)
                    {
                        update = true;
                    }
                }
                if (update)
                {
                    
                }
                num++;
            }
        }

        public static async Task<List<ProjectItem>> DeserializeUrlAsync(string url)
        {
            var txt = await GithubServices.DownloadstringAsync(url);
            if (string.IsNullOrEmpty(txt) || string.IsNullOrWhiteSpace(txt))
                return null;
            return System.Text.Json.JsonSerializer.Deserialize<List<ProjectItem>>(txt);
        }
        private static string SerializeObject(object obj)
        {
            return System.Text.Json.JsonSerializer.Serialize(obj);
        }

        private static List<ProjectItem> GetSampleItems()
        {
            string json = null;
            var stream = GetResourceStreamAsync(typeof(DataServiceProvider), "Blazor_App.Shared.Servers.sample.txt");
            using (StreamReader reader = new StreamReader(stream))
            {
                json = reader.ReadToEnd();
            }
            return System.Text.Json.JsonSerializer.Deserialize<List<ProjectItem>>(json);
        }
        public static Stream GetResourceStreamAsync(Type type, string pathDot)
        {
            var assembly = type.GetTypeInfo().Assembly;
            Stream stream = assembly.GetManifestResourceStream(pathDot);
            return stream;
        }
    }
    public class GitHubSettings
    {
        public bool AlwaysUpdate { get; set; }
        public string Categories { get; set; }
        public string MainUrl { get; set; }

        public static string _token = "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";
        const string _settings_url = "https://raw.githubusercontent.com/nextcodelab/data-base-server/main/host_data/codes/codes_data_settings.json";
        public static async Task<GitHubSettings> FetchGithubSettingsAsync()
        {
            var g_data = await GithubServices.DownloadStringAsync(_settings_url);
            return Newtonsoft.Json.JsonConvert.DeserializeObject<GitHubSettings>(g_data);
        }

        #region Static
        public static string PlatformUrl(GitHubSettings settings, FrameWork? frameWork = null)
        {
            string platformUrl = "https://github.com/nextcodelab/data-base-server/blob/main/host_data/codes/maui/";
            if(frameWork != null)
            {
                platformUrl = settings.MainUrl + frameWork.ToString().ToLower() + "/";
                return platformUrl;
            }
            foreach (var frame in Enum.GetNames(typeof(FrameWork)))
            {
                if (frame == SiteInfo.FrameWork.ToString())
                {
                    platformUrl = settings.MainUrl + frame.ToString().ToLower() + "/";
                    break;
                }
            }

            return platformUrl;
        }
        public static string AllItemsUrl(GitHubSettings settings)
        {
            var url = PlatformUrl(settings) + "Manager/AllItems.json";
            return url;
        }
        #endregion
    }
}
