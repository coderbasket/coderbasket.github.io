using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Blazor_App.Shared.Extensions
{
    public class MarkDownHelper
    {
        //https://raw.githubusercontent.com/{owner}/{repo}/{branch}/README.md
        public static string GetReadMe(string githubRepo)
        {
            var readme = "https://raw.githubusercontent.com/";
            return readme;
        }
    }
}
