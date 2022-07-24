using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;

namespace Blazor_App.Shared.Extensions
{
    public static class EnumerableListExtension
    {
        public static T PickRandom<T>(this IEnumerable<T> source)
        {
            return source.PickRandom(1).Single();
        }

        public static IEnumerable<T> PickRandom<T>(this IEnumerable<T> source, int count)
        {
            return source.Shuffle().Take(count);
        }

        public static IEnumerable<T> Shuffle<T>(this IEnumerable<T> source)
        {
            return source.OrderBy(x => Guid.NewGuid());
        }
        public static IEnumerable<List<T>> SplitList<T>(this List<T> locations, int nSize = 100)
        {
            for (int i = 0; i < locations.Count; i += nSize)
            {
                yield return locations.GetRange(i, Math.Min(nSize, locations.Count - i));
            }
        }

        /// <summary>
        ///  list.WhereAtleastOneProperty((string s) => s=="stringSample"); or var filterList = list..WhereAtleastOneProperty((string s) => s.Contains("stringSample")).ToList();
        /// </summary>
        /// <typeparam name="T"></typeparam>
        /// <typeparam name="PropertyType"></typeparam>
        /// <param name="source"></param>
        /// <param name="predicate"></param>
        /// <returns></returns>
        public static IEnumerable<T> WhereAtleastOneProperty<T, PropertyType>(this IEnumerable<T> source,
            Predicate<PropertyType> predicate)
        {
            var properties = typeof(T).GetProperties().Where(prop => prop.CanRead && prop.PropertyType == typeof(PropertyType)).ToArray();
            return source.Where(item => properties.Any(prop => PropertySatisfiesPredicate(predicate, item, prop)));
        }
        private static bool PropertySatisfiesPredicate<T, PropertyType>(Predicate<PropertyType>
            predicate, T item, System.Reflection.PropertyInfo pro)
        {
            try
            {
                return predicate((PropertyType)pro.GetValue(item));
            }
            catch
            {
                return false;
            }
        }
        //var query = people.DistinctBy(p => p.Id);
        public static IEnumerable<TSource> DistinctBy<TSource, TKey>(this IEnumerable<TSource> source, Func<TSource, TKey> keySelector)
        {
            HashSet<TKey> seenKeys = new HashSet<TKey>();
            foreach (TSource element in source)
            {
                if (seenKeys.Add(keySelector(element)))
                {
                    yield return element;
                }
            }
        }
    }
}
