using Octokit;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace Blazor_App.Shared.Extensions
{
    public class GitHubRepoInfo
    {
        public GitHubRepoInfo()
        {
        }

        public GitHubRepoInfo(string _gitHubRepoName)
        {
            Init(_gitHubRepoName);
        }
        bool _initDone = false;
        void Init(string _gitHubRepoName)
        {
            if (_gitHubRepoName.StartsWith("https://github.com/"))
            {
                ProjectUrl = _gitHubRepoName;
                GitHubRepoName = _gitHubRepoName.Replace("https://github.com/", "");
            }
            else if (_gitHubRepoName.StartsWith("github.com/"))
            {
                ProjectUrl = "https://" + _gitHubRepoName;
                GitHubRepoName = _gitHubRepoName.Replace("github.com/", "");
            }
            else
            {
                ProjectUrl = "https://github.com/" + _gitHubRepoName;
                GitHubRepoName = _gitHubRepoName;
            }
            OwnerName = ProjectUrl.Split("https://github.com/").LastOrDefault().Split("/").FirstOrDefault();
            ProjectName = GitHubRepoName.Split("/").LastOrDefault();
            OwnerGitUrl = "https://github.com/" + OwnerName;
            DownloadZipUrl = ProjectUrl + "/archive/refs/heads/main.zip";
            _initDone = true;
        }
        public bool IsInfoLoaded = false;
        public async Task<GitHubRepoInfo> LoadInfoAsync(string projectUrl = null)
        {
            if (_initDone == false)
            {
                if (!string.IsNullOrEmpty(projectUrl))
                    Init(projectUrl);
                else
                {
                    if (!string.IsNullOrEmpty(GitHubRepoName))
                        Init(GitHubRepoName);
                }
            }
            User = await GetUserAsync(this);
            var repo = await GetRepositoryAsync(this);
            Repo = repo;
            Forks = repo.ForksCount;
            Stars = repo.StargazersCount;
            UpdatedAt = repo.UpdatedAt.Date;
            WatchersCount = repo.WatchersCount;
            if (string.IsNullOrEmpty(this.Description))
            {
                Description = repo.Description;
            }
            IsInfoLoaded = true;
            return this;
        }
        public Repository Repo { get; private set; }
        public User User { get; private set; }
        public string DownloadZipUrl { get; private set; }
        public string ProjectName { get; private set; }
        public string OwnerName { get; private set; }
        public string ProjectUrl { get; private set; }
        public string OwnerGitUrl { get; private set; }
        public int WatchersCount { get; private set; }
        /// <summary>
        /// Unique info from Author the outhers properties is set from github api service
        /// </summary>
        public string GitHubRepoName { get; set; }

        //[JsonProperty("name")]
        //public string Name { get; private set; }

        [JsonPropertyName("full_name")]
        public virtual string FullName { get; set; }

        [JsonPropertyName("description")]
        public virtual string Description { get; set; }

        [JsonPropertyName("stargazers_count")]
        public virtual int Stars { get; set; }

        [JsonPropertyName("forks_count")]
        public virtual int Forks { get; set; }

        [JsonPropertyName("pushed_at")]
        public virtual DateTime UpdatedAt { get; set; }

        public GitHubRepoInfo GetRepoInfoFromService(List<GitHubRepoInfo> repoListFromService)
        {
            if (repoListFromService == null || repoListFromService.Count.Equals(0))
                return this;

            var obj = repoListFromService.FirstOrDefault(x => x.FullName.ToLower().Equals(this.GitHubRepoName.ToLower()));

            if (string.IsNullOrEmpty(obj?.FullName))
                return this;

            obj.GitHubRepoName = this.GitHubRepoName;
            return obj;
        }
        public async static Task<User> GetUserAsync(GitHubRepoInfo repoInfo)
        {
            var github = new GitHubClient(new ProductHeaderValue("MyAmazingApp"));
            var user = await github.User.Get(repoInfo.OwnerName);
            var repo = await github.Repository.Get(repoInfo.OwnerName, repoInfo.ProjectName);
            return user;
        }
        public async static Task<Repository> GetRepositoryAsync(GitHubRepoInfo repoInfo)
        {
            var github = new GitHubClient(new ProductHeaderValue("MyAmazingApp"));
            var repo = await github.Repository.Get(repoInfo.OwnerName, repoInfo.ProjectName);
            return repo;
        }
        public static string GetReadMe(GitHubRepoInfo repoInfo, string branch = "master")
        {
            ////https://raw.githubusercontent.com/{owner}/{repo}/{branch}/README.md
            var readme = string.Format("https://raw.githubusercontent.com/{0}/{1}/{2}/README.md", repoInfo.OwnerName, repoInfo.ProjectName, branch);
            return readme;
        }
        public static List<string> ExtractImageUrls(string markDown)
        {
            //https://github.com/dotnet/maui/raw/main/Assets/maui-weather-hero-sm.png
            var matches = new Regex(@"!\[.*?\]\(.*?\)")
                .Matches(markDown)
                .Cast<Match>()
                .Select(m => m.Value)
                .ToList();
            return matches;
        }
    }
}
