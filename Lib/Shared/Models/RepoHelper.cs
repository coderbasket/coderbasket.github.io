using Blazor_App.Shared.Extensions;
using Blazor_App.Shared.Infrastructure;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

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
            projectItem.Slug = ToUrlSlug(projectItem.ProjectUrl);
            projectItem.Repository = new GitHubRepository(projectItem.ProjectUrl);
            if (projectItem.GitHubRepoInfo == null)
                projectItem.GitHubRepoInfo = new GitHubRepoInfo(projectItem.ProjectUrl);
        }
    }
}
