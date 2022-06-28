using Blazor_App.Shared.Extensions;
using Blazor_App.Shared.Infrastructure;
using Blazor_App.Shared.Servers;
using System;
using System.Collections.Generic;
using System.Diagnostics.Metrics;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
#nullable disable
namespace Blazor_App.Shared.Models
{
    public class ProjectOwner
    {
        public int Id { get; set; }
        public string UserId { get; set; }

        public string FirstName { get; set; }

        public string LastName { get; set; }

        public string Website { get; set; }

        public string TwitterHandle { get; set; }

        public string GitHubHandle { get; set; }

        public string GravatarHash { get; set; }

        public static ProjectOwner GetDefaultAuthor(GitHubRepoInfo repoInfo)
        {
            var authorInfo = new ProjectOwner();

            authorInfo.Id = 0;
            authorInfo.UserId = repoInfo.OwnerGitUrl;
            authorInfo.FirstName = repoInfo.OwnerName;
            authorInfo.LastName = repoInfo.OwnerName;
            authorInfo.Website = repoInfo.User == null ? "" : repoInfo.User.Blog;
            authorInfo.TwitterHandle = null;
            authorInfo.GitHubHandle = repoInfo.OwnerName;
            authorInfo.GravatarHash = "";
            
            return authorInfo;
        }
        const int size = 200;
        public string GravatarImage()
        {


            var hash = this.GravatarHash;

            //var defaultImage = HttpUtility.UrlEncode();  // TODO: ConfigurationManager.AppSettings["DefaultGravatarImage"]);

            return $"//www.gravatar.com/avatar/{hash}.jpg?s={size}";  // &d={defaultImage}";
        }
    }
}
