﻿using System;
using System.Text.RegularExpressions;

namespace Blazor_App.Shared.Extensions
{
    public static class StringExtensions
    {
        private static readonly int MaxLength = 400;

        public static string Sanitize(this string value)
        {
            if (string.IsNullOrEmpty(value)) return value;

            return value.StripHtmlTags().Truncate(MaxLength);
        }

        public static string StripHtmlTags(this string htmlContent)
        {
            if (string.IsNullOrEmpty(htmlContent)) return htmlContent;

            // Strip out any HTML content.
            var strippedContent = Regex.Replace(htmlContent, @"<[^>]*>", String.Empty);
            return strippedContent;
        }

        public static string Truncate(this string value, int maxLength, bool includeLastSentence = true)
        {
            if (string.IsNullOrEmpty(value)) return value;
            if (value.Length <= maxLength) return value;

            var truncatedContent = value.Substring(0, maxLength);

            if (includeLastSentence && value.IndexOf('.', maxLength) > -1)
            {
                truncatedContent += value.Substring(maxLength, value.IndexOf('.', maxLength) - maxLength + 1);
            }

            return truncatedContent;
        }
        public static bool IsValidString(this string txt)
        {
            if (string.IsNullOrEmpty(txt) || string.IsNullOrWhiteSpace(txt))
                return false;
            return true;
        }
    }
}
