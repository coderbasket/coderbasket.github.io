using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Blazor_App.Shared
{
    public class SafeHelper
    {
        public static List<string> GetContainsSafeImageUrls()
        {
            var list = new List<string>();
            list.Add("https://github.com/");
            list.Add("githubusercontent");
            list.Add("https://user-images.githubusercontent");
            list.Add("https://raw.githubusercontent.com");
            list.Add("amazonaws");
            list.Add("uno-website-assets");
            list.Add("https://camo.githubusercontent");
            list.Add("visualstudiomagazine.com");
            list.Add("medium.com");
            list.Add("microsoft.com");
            list.Add("devblogs.microsoft.com");
            list.Add("telerik.com");
            list.Add("miro.medium.com");
            list.Add("https://play-lh.googleusercontent.com/");
            return list;
        }
    }
}
