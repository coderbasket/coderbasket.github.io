﻿using System;
using System.Web;
using Blazor_App.Shared.Infrastructure;

namespace Blazor_App.Shared.Extensions
{
 public static class GravatarHashingExtensions
    {
        public static string GravatarImage(this AmAnAuthor member)
        {
            const int size = 200;

            var hash = member.GravatarHash;

            //var defaultImage = HttpUtility.UrlEncode();  // TODO: ConfigurationManager.AppSettings["DefaultGravatarImage"]);

            return $"//www.gravatar.com/avatar/{hash}.jpg?s={size}";  // &d={defaultImage}";
        }
    }
}
