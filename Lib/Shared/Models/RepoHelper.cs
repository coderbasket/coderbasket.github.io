using Blazor_App.Shared.Enums;
using Blazor_App.Shared.Extensions;
using Blazor_App.Shared.Infrastructure;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;
#nullable disable
namespace Blazor_App.Shared.Models
{
    public class RepoHelper
    {
        public static string ToUrlSlug(string str)
        {

            StringBuilder sb = new StringBuilder();
            foreach (char c in str)
            {
                if ((c >= '0' && c <= '9') || (c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') || c == '.' || c == '_')
                {
                    sb.Append(c);
                }
            }
            return sb.ToString();
        }
        public static void GetRepository(ProjectItem projectItem)
        {
            if (projectItem.Repository !=null)
                return;
            projectItem.Slug = ToUrlSlug(projectItem.ProjectUrl);
            projectItem.Repository = new GitHubRepository(projectItem.ProjectUrl);
            if (projectItem.GitHubRepoInfo == null)
                projectItem.GitHubRepoInfo = new GitHubRepoInfo(projectItem.ProjectUrl);
            projectItem.IsLoaded = false;
        }
        public static ProjectItem LoadRepository(ProjectItem projectItem)
        {
            if (projectItem.Repository!=null)
                return projectItem;
            if (string.IsNullOrEmpty(projectItem.Slug))
            {
                projectItem.Slug = ToUrlSlug(projectItem.ProjectUrl);
            }
            projectItem.Repository = new GitHubRepository(projectItem.ProjectUrl);
            if (projectItem.GitHubRepoInfo == null)
                projectItem.GitHubRepoInfo = new GitHubRepoInfo(projectItem.ProjectUrl);
            projectItem.IsLoaded = false;
            return projectItem;
        }
        static Dictionary<string, string> DictionaryJson = new Dictionary<string, string>();
        public async static Task<string> GetJsonAsync(ProjectItem projectItem)
        {
            if (DictionaryJson.ContainsKey(projectItem.ProjectUrl))
            {
                return DictionaryJson[projectItem.ProjectUrl];
            }
            string jsonP = "";
            using (HttpClient client = new HttpClient())
            {
                client.DefaultRequestHeaders.Accept.Add(new
                System.Net.Http.Headers.MediaTypeWithQualityHeaderValue("application/json"));
                client.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36");
                var url = "https://api.github.com/repos/" + projectItem.ProjectUrl.Replace("https://github.com/", "");
                using (HttpResponseMessage response = await client.GetAsync(url))
                {
                    using (HttpContent content = response.Content)
                    {
                        jsonP = await content.ReadAsStringAsync();
                        if (!string.IsNullOrEmpty(jsonP))
                        {
                            DictionaryJson[projectItem.ProjectUrl] = jsonP;
                        }
                    }
                }
            }
            return jsonP;
        }
        public static Category GetCategory(string category)
        {
            Category _category = Category.OTHERS;
            foreach (var item in Enum.GetNames(typeof(Category)))
            {
                if (category.ToLower() == item.ToLower())
                {
                    _category = (Category)Enum.Parse(typeof(Category), item);
                    break;
                }
            }
            return _category;
        }
        public static FrameWork ConvertFramework(string framework)
        {
            FrameWork _framework = FrameWork.Maui;
            foreach (var item in Enum.GetNames(typeof(FrameWork)))
            {
                if (framework.ToLower() == item.ToLower())
                {
                    _framework = (FrameWork)Enum.Parse(typeof(FrameWork), item);
                    break;
                }
            }
            return _framework;
        }
        public static Stream GetResourceStreamAsync(Type type, string pathDot)
        {
            var assembly = type.GetTypeInfo().Assembly;
            Stream stream = assembly.GetManifestResourceStream(pathDot);
            return stream;
        }
       
        public static bool IsValidRepo(ProjectItem repo)
        {
            if (repo == null)
                return false;
            if (repo.ProjectUrl.IsValidString() == false)
                return false;
            if (repo.ProjectUrl.StartsWith("https://github.com/") == false)
                return false;
            if (repo.Title.IsValidString()
                && repo.Description.IsValidString()
                && repo.ImageUrls?.Count > 0
                && repo.Categories?.Count() > 0
                && repo.Platforms?.Length > 0
                )
            {
                
                return true;
            }
            return false;
        }
        
    }
}
