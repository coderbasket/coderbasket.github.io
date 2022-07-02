using Blazor_App.Shared.Enums;
using Blazor_App.Shared.Extensions;
using Blazor_App.Shared.Infrastructure;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
#nullable disable
namespace Blazor_App.Shared.Models
{
    public class ProjectItem
    {
        public ProjectItem()
        {

        }
        private string _repo;

        public string ProjectUrl
        {
            get { return _repo; }
            set 
            { 
                _repo = value;
                if (!string.IsNullOrEmpty(_repo))
                {
                    Slug = RepoHelper.ToUrlSlug(_repo);
                }
                
            }
        }
        public string Title { get; set; }
        public string Description { get; set; }
        public string[] Platforms { get; set; } = new string[] {"iOS", "Android", "Windows", "Mac", "Linux", "Linux", "Browser", };
        public string ExternalUrl { get; set; }
        public string YoutubeUrl { get; set; }
        public string FrameWorkName { get; set; } = SiteInfo.FrameWork.ToString();
        public List<string> ImageUrls { get; set; } = new List<string>();
        public List<Category> Categories { get; set; } = new List<Category>() { Category.OTHERS };
        public string Slug { get; set; }
        public string GravatarHash { get; set; }
        public void Update()
        {
            if (string.IsNullOrEmpty(this.ProjectUrl))
                return;
            RepoHelper.GetRepository(this);
        }
        [JsonIgnore]
        public GitHubRepository Repository { get; set; }
        [JsonIgnore]
        public GitHubRepoInfo GitHubRepoInfo { get; set; }
        [JsonIgnore]
        public bool IsLoaded { get; set; }
        [JsonIgnore]
        public ProjectOwner Owner { get; set; }

      

    }
}
