using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
#nullable disable
namespace Blazor_App.Shared.Infrastructure
{
    
    // Root myDeserializedClass = JsonConvert.DeserializeObject<Root>(myJsonResponse); 
    public class Owner
    {
        public string login { get; set; }
        public int id { get; set; }
        public string node_id { get; set; }
        public string avatar_url { get; set; }
        public string gravatar_id { get; set; }
        public string url { get; set; }
        public string html_url { get; set; }
        public string followers_url { get; set; }
        public string following_url { get; set; }
        public string gists_url { get; set; }
        public string starred_url { get; set; }
        public string subscriptions_url { get; set; }
        public string organizations_url { get; set; }
        public string repos_url { get; set; }
        public string events_url { get; set; }
        public string received_events_url { get; set; }
        public string type { get; set; }
        public bool site_admin { get; set; }
    }

    public class License
    {
        public string key { get; set; }
        public string name { get; set; }
        public string spdx_id { get; set; }
        public string url { get; set; }
        public string node_id { get; set; }
    }

    public class GithubRepoInformation
    {
        public int id { get; set; }
        public string node_id { get; set; }
        public string name { get; set; }
        public string full_name { get; set; }
        public bool @private { get; set; }
        public Owner owner { get; set; }
        public string html_url { get; set; }
        public string description { get; set; }
        public bool fork { get; set; }
        public string url { get; set; }
        public string forks_url { get; set; }
        public string keys_url { get; set; }
        public string collaborators_url { get; set; }
        public string teams_url { get; set; }
        public string hooks_url { get; set; }
        public string issue_events_url { get; set; }
        public string events_url { get; set; }
        public string assignees_url { get; set; }
        public string branches_url { get; set; }
        public string tags_url { get; set; }
        public string blobs_url { get; set; }
        public string git_tags_url { get; set; }
        public string git_refs_url { get; set; }
        public string trees_url { get; set; }
        public string statuses_url { get; set; }
        public string languages_url { get; set; }
        public string stargazers_url { get; set; }
        public string contributors_url { get; set; }
        public string subscribers_url { get; set; }
        public string subscription_url { get; set; }
        public string commits_url { get; set; }
        public string git_commits_url { get; set; }
        public string comments_url { get; set; }
        public string issue_comment_url { get; set; }
        public string contents_url { get; set; }
        public string compare_url { get; set; }
        public string merges_url { get; set; }
        public string archive_url { get; set; }
        public string downloads_url { get; set; }
        public string issues_url { get; set; }
        public string pulls_url { get; set; }
        public string milestones_url { get; set; }
        public string notifications_url { get; set; }
        public string labels_url { get; set; }
        public string releases_url { get; set; }
        public string deployments_url { get; set; }
        public DateTime created_at { get; set; }
        public DateTime updated_at { get; set; }
        public DateTime pushed_at { get; set; }
        public string git_url { get; set; }
        public string ssh_url { get; set; }
        public string clone_url { get; set; }
        public string svn_url { get; set; }
        public string homepage { get; set; }
        public int size { get; set; }
        public int stargazers_count { get; set; }
        public int watchers_count { get; set; }
        public string language { get; set; }
        public bool has_issues { get; set; }
        public bool has_projects { get; set; }
        public bool has_downloads { get; set; }
        public bool has_wiki { get; set; }
        public bool has_pages { get; set; }
        public int forks_count { get; set; }
        public object mirror_url { get; set; }
        public bool archived { get; set; }
        public bool disabled { get; set; }
        public int open_issues_count { get; set; }
        public License license { get; set; }
        public bool allow_forking { get; set; }
        public bool is_template { get; set; }
        public List<string> topics { get; set; }
        public string visibility { get; set; }
        public int forks { get; set; }
        public int open_issues { get; set; }
        public int watchers { get; set; }
        public string default_branch { get; set; }
        public object temp_clone_token { get; set; }
        public int network_count { get; set; }
        public int subscribers_count { get; set; }

        
    }
    public class GitHubRepository
    {
        public GitHubRepository()
        {

        }
        public GitHubRepository(string projectUrl)
        {
            this.Init(projectUrl);
        }
        public string ProjectUrl { get; set; }
        public string ProjectName { get; set; }
        public string RepoSlashName { get; set; }
        public string OwnerName { get; set; }
        public string DownloadZipUrl { get; private set; }
        public string OwnerGitUrl { get; private set; }

        public GithubRepoInformation RepoInformation { get; set; }
        public async void LoadApiInfo()
        {
            if(string.IsNullOrEmpty(RepoSlashName))
                throw new Exception(nameof(RepoSlashName));
            var url = "https://api.github.com/repos/" + RepoSlashName;
            string jsonP = null;
            using (HttpClient client = new HttpClient())
            {

                client.DefaultRequestHeaders.Accept.Add(new
                System.Net.Http.Headers.MediaTypeWithQualityHeaderValue("application/json"));
                client.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36");
                using (HttpResponseMessage response = await client.GetAsync(url))
                {
                    using (HttpContent content = response.Content)
                    {
                        jsonP = await content.ReadAsStringAsync();
                        if (!string.IsNullOrEmpty(jsonP))
                        {
                            this.RepoInformation = System.Text.Json.JsonSerializer.Deserialize<GithubRepoInformation>(jsonP);
                        }
                    }
                }
            }
        }
        void Init(string projectUrl)
        {
            ProjectUrl = projectUrl;
            RepoSlashName = projectUrl.Replace("https://github.com/", "");
            OwnerName = ProjectUrl.Split("https://github.com/").LastOrDefault().Split("/").FirstOrDefault();
            ProjectName = RepoSlashName.Split("/").LastOrDefault();
            OwnerGitUrl = "https://github.com/" + OwnerName;
            DownloadZipUrl = ProjectUrl + "/archive/refs/heads/main.zip";
           
        }
    }

}
