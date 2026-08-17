using Blazor_App.Shared.Extensions;
using Blazor_App.Shared.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Blazor_App.Shared
{
    public class SafeHelper
    {
        static List<string> list = null;
        public async static Task<List<string>> GetContainsSafeImageUrlsAsync()
        {
            if (list != null && list.Count > 0)
                return list;
            await Task.Delay(1);
#if DEBUG
            var stream = RepoHelper.GetResourceStreamAsync(typeof(SafeHelper), "Blazor_App.Shared.Data.safe_urls.json");
            using (StreamReader reader = new StreamReader(stream))
            {
                string text = reader.ReadToEnd();
                if (text.IsValidString())
                {
                    list = Newtonsoft.Json.JsonConvert.DeserializeObject<List<string>>(text);
                }
            }
#else
            string url = "https://github.com/coderbasket/coderbasket.github.io/blob/development/Lib/Shared/Data/safe_urls.json";
            var txt = await CookUpServices.DownloadstringAsync(url);
            if (txt.IsValidString())
            {
                list = Newtonsoft.Json.JsonConvert.DeserializeObject<List<string>>(txt);
            }
           
#endif
            return list;
        }
    }
}
