using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using Blazor_App.Shared.Models;
namespace Blazor_App.Shared
{
    public class WordsFilter
    {
        public static string Filter(string input)
        {
            if (ContainWords(input) == false)
                return input;
            var splits = SplitAndKeep(input, " ");
            for(int i = 0; i < splits.Length; i++)
            {
                var val = splits[i];
                if (!string.IsNullOrEmpty(val))
                {
                    if (GetExcludeWords().Contains(val))
                    {
                        splits[i] = ConvertToStars(val);
                    }
                }
            }
            input = string.Join("", splits);
            return input;
        }
        public static bool FilterIsSafeWords(string input)
        {
            bool safeWords = true;
            if (ContainWords(input) == false)
                return safeWords;
            var splits = SplitAndKeep(input, " ");
            for (int i = 0; i < splits.Length; i++)
            {
                var val = splits[i];
                if (!string.IsNullOrEmpty(val))
                {
                    if (GetExcludeWords().Contains(val))
                    {
                        splits[i] = ConvertToStars(val);
                        safeWords = false;
                    }
                }
            }
            
            return safeWords;
        }
        private static string ConvertToStars(string val)
        {
            if (string.IsNullOrEmpty(val))
                return val;
            List<char> list = new List<char>();
            foreach(var i in val.ToArray())
            {
                list.Add('✧');
            }
            return new string(list.ToArray());
        }
        public static string[] SplitAndKeep(string input, string pattern)
        {
            pattern = "(" + pattern + ")";
            var rx = new System.Text.RegularExpressions.Regex(pattern, RegexOptions.IgnoreCase);
            var substrings = rx.Split(input);
            return substrings;
        }
        public static bool ContainWord(string input)
        {
            return GetExcludeWords().Contains(input);
        }
        public static bool ContainWords(string sentence)
        {
            var splits = sentence.Split();
            foreach (var i in splits)
            {
                if (!string.IsNullOrEmpty(i))
                {
                    var contain = GetExcludeWords().Contains(i);
                    if (contain)
                        return true;

                }
            }
            return false;
        }
        static string[] excludeWords = null;
        public static string[] GetExcludeWords()
        {
            if (excludeWords != null)
                return excludeWords;
            var list = new List<string>();
            var stream = RepoHelper.GetResourceStreamAsync(typeof(RepoHelper), "Blazor_App.Shared.Data.bad_words.txt");
            using (StreamReader sr = new StreamReader(stream))
            {
                while (sr.Peek() >= 0)
                {
                    var str = sr.ReadLine();
                    if (!string.IsNullOrEmpty(str) && !string.IsNullOrWhiteSpace(str))
                    {
                        list.Add(str);
                    }
                }
            }
            excludeWords = list.ToArray();
            return excludeWords;
        }
        public static async void LoadFilters()
        {
            await Task.Run(() =>
            {
                var filters = GetExcludeWords();
            });
        }
    }
}
