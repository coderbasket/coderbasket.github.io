using Blazor_App.Shared.Extensions;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Blazor_App.Shared.Tools
{
    public class ToolHelper
    {
        static ToolRoot toolRoot = null;
        public async static Task<ToolRoot> GetToolItemsAsync()
        {
            if(toolRoot != null)
            {
                return toolRoot;
            }
            string url = "https://raw.githubusercontent.com/coderbasket/coderbasket.github.io/development/Lib/Shared/Tools/tools_data.json";
            var txt = await CookUpServices.DownloadstringAsync(url);
            if (txt.IsValidString())
            {
                var result = JsonConvert.DeserializeObject<ToolRoot>(txt);
                if (result != null)
                {
                    toolRoot = result;
                }
            }
            return toolRoot;
        }
    }
    public class ToolRoot
    {
        public string Title { get; set; }
        public List<ToolItem> Items { get; set; } = new List<ToolItem>();
    }
    public class ToolItem
    {
        public string Name { get; set; }
        public string Summary { get; set; }
        public string Description { get; set; }

        public string Url { get; set; }
        public string[] Images { get; set; }
    }
}
