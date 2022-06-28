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
            if (projectItem.IsLoaded)
                return;
            projectItem.Slug = ToUrlSlug(projectItem.ProjectUrl);
            projectItem.Repository = new GitHubRepository(projectItem.ProjectUrl);
            if (projectItem.GitHubRepoInfo == null)
                projectItem.GitHubRepoInfo = new GitHubRepoInfo(projectItem.ProjectUrl);
            projectItem.IsLoaded = false;
        }
        public static Stream GetResourceStreamAsync(Type type, string pathDot)
        {
            var assembly = type.GetTypeInfo().Assembly;
            Stream stream = assembly.GetManifestResourceStream(pathDot);
            return stream;
        }
    }
}
