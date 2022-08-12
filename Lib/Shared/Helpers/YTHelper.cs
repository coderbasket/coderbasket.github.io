
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Blazor_App.Shared.Extensions;

namespace Blazor_App.Shared
{
    public class YTHelper
    {
        const string BASE_URL = "https://noembed.com/embed?url=";
        public static async Task<YTDetail> GetDetailsAsync(string youtubeUrl)
        {
            YTDetail ytDetail = null;
            if (youtubeUrl.IsValidString())
            {
                if (youtubeUrl.StartsWith("https://youtu.be/"))
                {

                    var videoId = youtubeUrl.Replace("https://youtu.be/", "");
                    var yt = "https://www.youtube.com/watch?v=" + videoId;
                    yt = yt.Trim();
                    youtubeUrl = yt;
                }
            }
            var url = BASE_URL + youtubeUrl;
            try
            {
                var json = await DownloadstringAsync(url);
                ytDetail = Newtonsoft.Json.JsonConvert.DeserializeObject<YTDetail>(json);
            }
            catch { }
            return ytDetail;
        }

        public static async Task<string> DownloadstringAsync(string txtFileUrl)
        {
            string jsonString = null;
            try
            {
                using (var httpClient = new HttpClient())
                {

                    var stream = await httpClient.GetStreamAsync(txtFileUrl);
                    StreamReader reader = new StreamReader(stream);
                    jsonString = reader.ReadToEnd();

                }
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
            }

            return jsonString;
        }
    }
    public class YTDetail
    {
        public string provider_name { get; set; }
        public int thumbnail_width { get; set; }
        public int width { get; set; }
        public string title { get; set; }
        public string author_name { get; set; }
        public string thumbnail_url { get; set; }
        public string author_url { get; set; }
        public string html { get; set; }
        public int height { get; set; }
        public string type { get; set; }
        public string provider_url { get; set; }
        public string url { get; set; }
        public string version { get; set; }
        public int thumbnail_height { get; set; }


    }


}
