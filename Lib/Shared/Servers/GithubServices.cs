using Octokit;
using System;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.NetworkInformation;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
#nullable disable
namespace Blazor_App.Shared.Servers
{
    public class GithubServices
    {
        public async static Task<string> GetContentAsync(GithubInfo githubInfo)
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
            catch (Octokit.NotFoundException)
            {
               
            }
            return content;

        }
        public async static void UpdateContentAsync(GithubInfo githubInfo, string message, string content)
        {
          

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
            }
            catch (Octokit.NotFoundException)
            {
                // if file is not found, create it
                var createChangeSet = await ghClient.Repository.Content.CreateFile(owner, repo, targetFile, new CreateFileRequest(message, content, branch));
            }
            catch(Exception ex)
            {

            }

        }
       
        public static GithubInfo GetExtractGithubInfo(string url, string token, string newFileName = null)
        {
            GithubInfo githubInfo = null;
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
                githubInfo = new GithubInfo()
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
            var rx = new System.Text.RegularExpressions.Regex(pattern, RegexOptions.IgnoreCase);
            var substrings = rx.Split(input);
            return substrings;
        }
        public static async Task<string> DownloadstringAsync(string txtFileUrl)
        {
            string jsonString = null;
            try
            {
                using (var httpClient = new System.Net.Http.HttpClient())
                {

                    var stream = await httpClient.GetStreamAsync(txtFileUrl);
                    StreamReader reader = new StreamReader(stream);
                    jsonString = reader.ReadToEnd();

                }
            }
            catch(Exception ex)
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
    public class GithubInfo
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
