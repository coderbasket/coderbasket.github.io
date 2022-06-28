using System;

namespace Blazor_App.Shared
{
    public class SiteInfo
    {

        //coderbasket
        public const string SiteName = "Coder Basket";
        public const string SiteUrlShort = "coderbasket.com";
        public const string SiteUrl = "https://coderbasket.azurewebsites.net/";
        public const string SiteFullUrl = SiteUrl;
        public const string Email = "coderbasketcontact@gmail.com";

        //Social
        public static string Twitter = "https://twitter.com/" + SiteUrlShort.Replace(".com", "");
        public static string TwitterAt = "@" + SiteUrlShort;
        public static string TextColor = "#000000";
        public static bool IsDarkTheme = false;
        private const string DefaultAccent = "#EA3D53"; //"#21bb9d";
        public const string AccentDarkerColor = "#B12B3D";
        public static string AccentColor = DefaultAccent;

        public static FrameWork FrameWork = FrameWork.Maui;
        public static string Title = SiteInfo.FrameWork.ToString() + " Templates";
        public static string ThemeColor = AccentColor;
        //Ads
        public const string UnitId = null;
        public static string GetHeader()
        {
            if (IsDarkTheme)
            {
                TextColor = "#FFFFFF";
            }
            else
            {
                TextColor = "#000000";
            }
            Title = SiteInfo.FrameWork.ToString() + " Templates";
            return SiteInfo.FrameWork.ToString() + " templates";
        }
        public static event EventHandler InfoChanged;
        public static void NotifyChanged()
        {
            InfoChanged?.Invoke(null, EventArgs.Empty);
        }
#if DEBUG
        public static bool IsDebug = true;
#else
        public static bool IsDebug = false;
#endif
    }
    public enum FrameWork
    {
        Maui = 1,
        Blazor = 2,
        Xamarin = 3,
        Flutter = 4, 
        
    }
}
