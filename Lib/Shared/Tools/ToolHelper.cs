using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Blazor_App.Shared.Tools
{
    public class ToolHelper
    {
        public async static Task<string> GetToolsItemsAsync()
        {
            string url = "";
            string json = "";
            var txt = await CookUpServices.DownloadstringAsync(url);
            return json;
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
        public List<string> Images { get; set; }
    }
}
