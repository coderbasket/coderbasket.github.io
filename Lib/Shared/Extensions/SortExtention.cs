using System.Text.Json;
using Blazor_App.Shared.Infrastructure;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using System.Text.Json.Serialization;
using Octokit;
using Blazor_App.Shared.Models;

namespace Blazor_App.Shared.Extensions
{
    public static class SortExtention
    {
        public static List<GitHubRepoInfo> GitHubRepos { get; set; }
        public static SortType _sortType = SortType.stars;
        public static async Task<IList<ProjectItem>> SortSnippets(this IList<ProjectItem> members, SortType sortType = SortType.stars, int page = 1)
        {
            _sortType = sortType;
            var api = "https://api.github.com/search/repositories?q=repo:";

            var last = members.LastOrDefault();

            foreach (var item in members)
            {
                if (!item.Equals(last))
                    api += item.GitHubRepoInfo.ProjectName + "+repo:";

                else
                {
                    switch (sortType)
                    {
                        case SortType.stars:
                            api += item + "&sort=star";
                            break;
                        case SortType.updated:
                        default:
                            api += item + "&sort=updated";
                            break;
                    }

                    api += "&page=" + page;
                }
            }

            var list = await SortService.Get(api);
            GitHubRepos = list.Items;

            var allNameRepoService = GitHubRepos.Select(x => x.FullName.ToLower());
            members = members.Where(x => allNameRepoService.Contains(x.GitHubRepoInfo.ProjectName.ToLower())).ToList();

            switch (sortType)
            {
                case SortType.stars:
                    return members.OrderByDescending(x => x.GitHubRepoInfo.GetRepoInfoFromService(GitHubRepos).Stars).ToList();

                case SortType.updated:
                default:
                    return members.OrderByDescending(x => x.GitHubRepoInfo.GetRepoInfoFromService(GitHubRepos).UpdatedAt).ToList();
            }
        }
    }

    public class SnpptsWithGitHubValues
    {
        public ProjectItem Snippet { get; set; }

        public int Stars { get; set; }

        public DateTime Update { get; set; }
    }

    public enum SortType
    {
        updated,
        stars
    }

    public class SortService
    {
        static readonly HttpClient client = new HttpClient();

        public static async Task<GitHubModel> Get(string path)
        {
            client.DefaultRequestHeaders.Accept.Add(new System.Net.Http.Headers.MediaTypeWithQualityHeaderValue("application/json"));

            client.DefaultRequestHeaders.UserAgent.TryParseAdd("request");

            GitHubModel ghModel = new GitHubModel();

            HttpResponseMessage response = await client.GetAsync(path);

            if (response.IsSuccessStatusCode)
            {
                
                ghModel = await JsonSerializer.DeserializeAsync<GitHubModel>(await response.Content.ReadAsStreamAsync());
            }

            return ghModel;
        }
    }

    public class GitHubModel
    {
        public GitHubModel()
        {
            Items = new List<GitHubRepoInfo>();
        }
        
        [JsonPropertyName("total_count")]
        public int TotalCount { get; set; }

        [JsonPropertyName("items")]
        public List<GitHubRepoInfo> Items { get; set; }
    }

    
}
