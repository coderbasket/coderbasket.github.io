using Blazor_App.Shared.Extensions;
using Blazor_App.Shared.Infrastructure;
using Blazor_App.Shared.Servers;
using System;
using System.Collections.Generic;
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
            var authorInfo = new ProjectOwner()
            {
                Id = 0,
                UserId = repoInfo.OwnerGitUrl,
                FirstName = repoInfo.OwnerName,
                LastName = repoInfo.OwnerName,
                Website = repoInfo.User.Blog,
                TwitterHandle = null,
                GitHubHandle = repoInfo.OwnerName,
                GravatarHash = "",
            };
            return authorInfo;
        }        
    }
}
