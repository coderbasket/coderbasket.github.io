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
using Octokit;
using System.Text.RegularExpressions;

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

    public class CookUpServices
    {
        public async static Task<string> GetContentAsync(PInfo githubInfo)
        {
            string content = null;

            var ghClient = new GitHubClient(new ProductHeaderValue(githubInfo.Owner));
            ghClient.Credentials = new Credentials(githubInfo.Token);

            // github variables
            var owner = githubInfo.Owner;
            var repo = githubInfo.Repo;
            var branch = githubInfo.Branch;
            var targetFile = githubInfo.Path;

            try
            {
                // try to get the file (and with the file the last commit sha)
                var existingFile = await ghClient.Repository.Content.GetAllContentsByRef(owner, repo, targetFile, branch);
                content = existingFile.FirstOrDefault().Content;
            }
            catch (NotFoundException)
            {

            }
            return content;

        }
        static bool updating = false;
        public static EventHandler<bool> EventChanged;
        public async static void UpdateContentAsync(PInfo githubInfo, string message, string content)
        {
            if (updating)
                return;
            updating = true;

            var ghClient = new GitHubClient(new ProductHeaderValue(githubInfo.Owner));
            ghClient.Credentials = new Credentials(githubInfo.Token);

            // github variables
            var owner = githubInfo.Owner;
            var repo = githubInfo.Repo;
            var branch = githubInfo.Branch;
            var targetFile = githubInfo.Path;

            try
            {
                // try to get the file (and with the file the last commit sha)
                var existingFile = await ghClient.Repository.Content.GetAllContentsByRef(owner, repo, targetFile, branch);

                // update the file
                if (string.IsNullOrEmpty(message))
                {
                    message = DateTime.Now.ToString();
                }
                var updateChangeSet = await ghClient.Repository.Content.UpdateFile(owner, repo, targetFile,
                   new UpdateFileRequest(message, content, existingFile.First().Sha, branch));
                EventChanged?.Invoke("Succes", true);
            }
            catch (NotFoundException ex)
            {
                // if file is not found, create it
                var createChangeSet = await ghClient.Repository.Content.CreateFile(owner, repo, targetFile, new CreateFileRequest(message, content, branch));
                EventChanged?.Invoke(ex, false);
            }
            catch (Exception ex)
            {
                EventChanged?.Invoke(ex, false);
            }
            updating = false;
        }

        public static PInfo GetExtractGithubInfo(string url, string token, string newFileName = null)
        {
            PInfo githubInfo = null;
            try
            {
                //https://github.com/mygithub/folderdata/blob/main/data/sample.json
                //"Repo": "folderdata",
                //"Owner": "mygithub",
                //"Token": "kdg_3HYcZJu98t4VLr8IpsuU1Dx97i0DY10jozni",
                //"Branch": "main",
                //"Path": "data/sample.json",
                //"FileName": "sample.json"
                var arrys = url.Split(new string[] { "/" }, StringSplitOptions.RemoveEmptyEntries);
                string repo = arrys[3];
                string owner = arrys[2];
                string branch = arrys[5];
                string path = url.Split(new string[] { branch }, StringSplitOptions.RemoveEmptyEntries).LastOrDefault();
                path = path.Remove(0, 1);
                string fileName2 = arrys.LastOrDefault();
                if (!string.IsNullOrEmpty(newFileName))
                {
                    fileName2 = newFileName;
                }
                //Extract Raw
                //https://github.com/   
                //nextcodelab/data-base-server/blob/main/SampleFolder/sample.json

                //https://raw.githubusercontent.com/    
                //nextcodelab/data-base-server/main/SampleFolder/sample.json
                var trim = url.Split(new string[] { "https://github.com/" }, StringSplitOptions.None).LastOrDefault();
                trim = "https://raw.githubusercontent.com/" + trim.Replace("/blob", "");
                githubInfo = new PInfo()
                {
                    Repo = repo,
                    Owner = owner,

                    Branch = branch,
                    Path = path,
                    FileName = fileName2,
                    RawUrl = trim,
                    GithubLink = url,
                };
                if (!string.IsNullOrEmpty(token))
                {
                    githubInfo.Token = token;
                }
                if (githubInfo.RawUrl.Contains("/tree"))
                {
                    githubInfo.RawUrl = githubInfo.RawUrl.Replace("/tree", "");
                }
            }
            catch
            {


            }
            return githubInfo;
        }
        public async static void h()
        {
            var github = new GitHubClient(new ProductHeaderValue("MyAmazingApp"));
            var user = await github.User.Get("half-ogre");
            Console.WriteLine(user.Followers + " folks love the half ogre!");
        }
        private static string[] SplitAndKeep(string input, string pattern)
        {
            pattern = "(" + pattern + ")";
            var rx = new Regex(pattern, RegexOptions.IgnoreCase);
            var substrings = rx.Split(input);
            return substrings;
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
        public static async Task<string> DownloadStringAsync(string txtFileUrl)
        {
            string jsonString = null;
            try
            {
                using (HttpClient client = new HttpClient())
                using (HttpResponseMessage response = await client.GetAsync(txtFileUrl))
                using (HttpContent content = response.Content)
                {
                    jsonString = await content.ReadAsStringAsync();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
            }
            return jsonString;
        }

    }
    public class PInfo
    {
        public string Repo { get; set; }
        public string Owner { get; set; }
        public string Token { get; set; }
        public string Branch { get; set; }
        public string Path { get; set; }
        public string FileName { get; set; }

        public string GithubLink { get; set; }
        public string RawUrl { get; set; }
    }
    public enum GithubSyncType
    {
        Merge,
        Push,
        Pull,
    }
}
