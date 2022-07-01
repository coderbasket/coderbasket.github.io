using System;
using System.Collections.Generic;
using System.Drawing;
using System.Text;

namespace Blazor_App.Shared
{
    public class ColorList
    {
        static Dictionary<string, Color> _colors = new Dictionary<string, Color>();
        public static string GetRandomColorHex()
        {
            if (SiteInfo.IsDarkTheme == false)
            {
                return GetRandomDarkColor().ToString();
            }
            return GetRandomLightColor().ToString();
        }
        public static string GetRandomColorHex(string key)
        {
            if (_colors.ContainsKey(key))
                return HexConverter(_colors[key]);
            Color color = Color.Purple;
            if (SiteInfo.IsDarkTheme)
            {
                color = GetRandomLightColor();
                _colors[key] = color;
            }
            else
            {
                color = GetRandomDarkColor();
                _colors[key] = color;
            }
            var hex = HexConverter(color);
            return hex;
        }
        private static String HexConverter(System.Drawing.Color c)
        {
            return "#" + c.R.ToString("X2") + c.G.ToString("X2") + c.B.ToString("X2");
        }
        //Random Dark Colors `
        public static Color GetRandomDarkColor()
        {
            var solid = Color.IndianRed;
            Random random = new Random();
            var num = random.Next(1, 48);
            switch (num)
            {
                case 1:
                    solid = Color.Navy;
                    break;
                case 2:
                    solid = Color.MidnightBlue;
                    break;
                case 3:
                    solid = Color.Olive;
                    break;
                case 4:
                    solid = Color.OrangeRed;
                    break;
                case 5:
                    solid = Color.OliveDrab;
                    break;
                case 6:
                    solid = Color.PaleVioletRed;
                    break;
                case 7:
                    solid = Color.MediumVioletRed;
                    break;
                case 8:
                    solid = Color.Maroon;
                    break;
                case 9:
                    solid = Color.MediumBlue;
                    break;
                case 10:
                    solid = Color.YellowGreen;
                    break;
                case 11:
                    solid = Color.Purple;
                    break;
                case 12:
                    solid = Color.Red;
                    break;
                case 13:
                    solid = Color.SlateBlue;
                    break;
                case 14:
                    solid = Color.RoyalBlue;
                    break;
                case 15:
                    solid = Color.Salmon;
                    break;
                case 16:
                    solid = Color.SeaGreen;
                    break;
                case 17:
                    solid = Color.Sienna;
                    break;
                case 18:
                    solid = Color.SaddleBrown;
                    break;
                case 19:
                    solid = Color.Crimson;
                    break;
                case 20:
                    solid = Color.DarkCyan;
                    break;
                case 21:
                    solid = Color.DarkGoldenrod;
                    break;
                case 22:
                    solid = Color.DarkGreen;
                    break;
                case 23:
                    solid = Color.DarkMagenta;
                    break;
                case 24:
                    solid = Color.DarkOliveGreen;
                    break;
                case 25:
                    solid = Color.DarkOrange;
                    break;
                case 26:
                    solid = Color.DarkOrchid;
                    break;
                case 27:
                    solid = Color.DarkRed;
                    break;
                case 28:
                    solid = Color.CornflowerBlue;
                    break;
                case 29:
                    solid = Color.Chocolate;
                    break;
                case 30:
                    solid = Color.Blue;
                    break;
                case 31:
                    solid = Color.BlueViolet;
                    break;
                case 32:
                    solid = Color.Brown;
                    break;
                case 33:
                    solid = Color.DarkSlateBlue;
                    break;
                case 34:
                    solid = Color.DarkBlue;
                    break;
                case 35:
                    solid = Color.HotPink;
                    break;
                case 36:
                    solid = Color.IndianRed;
                    break;
                case 37:
                    solid = Color.Indigo;
                    break;
                case 38:
                    solid = Color.DarkSlateGray;
                    break;
                case 39:
                    solid = Color.Green;
                    break;
                case 40:
                    solid = Color.DarkViolet;
                    break;
                case 41:
                    solid = Color.DeepPink;
                    break;
                case 42:
                    solid = Color.DeepSkyBlue;
                    break;
                case 43:
                    solid = Color.DodgerBlue;
                    break;
                case 44:
                    solid = Color.Firebrick;
                    break;
                case 45:
                    solid = Color.Fuchsia;
                    break;
                case 46:
                    solid = Color.Goldenrod;
                    break;
                case 47:
                    solid = Color.Gold;
                    break;
                case 48:
                    solid = Color.ForestGreen;
                    break;

                default:
                    solid = Color.IndianRed;
                    break;

            }
            return solid;
        }
        //Get Random Light Colors
        public static Color GetRandomLightColor()
        {
            var solid = Color.MistyRose;
            Random random = new Random();
            var num = random.Next(1, 37);
            switch (num)
            {
                case 1:
                    solid = Color.Moccasin;
                    break;
                case 2:
                    solid = Color.NavajoWhite;
                    break;
                case 3:
                    solid = Color.PaleGoldenrod;
                    break;
                case 4:
                    solid = Color.PaleGreen;
                    break;
                case 5:
                    solid = Color.PaleTurquoise;
                    break;
                case 6:
                    solid = Color.MediumSpringGreen;
                    break;
                case 7:
                    solid = Color.LightSkyBlue;
                    break;
                case 8:
                    solid = Color.LightSteelBlue;
                    break;
                case 9:
                    solid = Color.LightYellow;
                    break;
                case 10:
                    solid = Color.MediumTurquoise;
                    break;
                case 11:
                    solid = Color.Linen;
                    break;
                case 12:
                    solid = Color.MediumAquamarine;
                    break;
                case 13:
                    solid = Color.PapayaWhip;
                    break;
                case 14:
                    solid = Color.Tan;
                    break;
                case 15:
                    solid = Color.Thistle;
                    break;
                case 16:
                    solid = Color.Wheat;
                    break;
                case 17:
                    solid = Color.Turquoise;
                    break;
                case 18:
                    solid = Color.PeachPuff;
                    break;
                case 19:
                    solid = Color.SkyBlue;
                    break;
                case 20:
                    solid = Color.Pink;
                    break;
                case 21:
                    solid = Color.Plum;
                    break;
                case 22:
                    solid = Color.PowderBlue;
                    break;
                case 23:
                    solid = Color.RosyBrown;
                    break;
                case 24:
                    solid = Color.LightSalmon;
                    break;
                case 25:
                    solid = Color.LightGreen;
                    break;
                case 26:
                    solid = Color.LightPink;
                    break;
                case 27:
                    solid = Color.Aqua;
                    break;
                case 28:
                    solid = Color.Aquamarine;
                    break;
                case 29:
                    solid = Color.Bisque;
                    break;
                case 30:
                    solid = Color.Coral;
                    break;
                case 31:
                    solid = Color.BurlyWood;
                    break;
                case 32:
                    solid = Color.CadetBlue;
                    break;
                case 33:
                    solid = Color.DarkTurquoise;
                    break;
                case 34:
                    solid = Color.Khaki;
                    break;
                case 35:
                    solid = Color.Lavender;
                    break;
                case 36:
                    solid = Color.LavenderBlush;
                    break;
                case 37:
                    solid = Color.LightBlue;
                    break;
                default:
                    solid = Color.Coral;
                    break;
            }
            return solid;
        }
        static List<Color> list = null;
        public static List<Color> GetColors()
        {
            if (list != null)
                return list;
            if (list == null)
                list = new List<Color>();
            list.Add(Color.MistyRose);
            list.Add(Color.Moccasin);
            list.Add(Color.NavajoWhite);
            list.Add(Color.PaleGoldenrod);
            list.Add(Color.PaleGreen);
            list.Add(Color.PaleTurquoise);
            list.Add(Color.MediumSpringGreen);
            list.Add(Color.LightSkyBlue);
            list.Add(Color.LightSteelBlue);
            list.Add(Color.LightYellow);
            list.Add(Color.MediumTurquoise);
            list.Add(Color.Linen);
            list.Add(Color.MediumAquamarine);
            list.Add(Color.PapayaWhip);
            list.Add(Color.Tan);
            list.Add(Color.Thistle);
            list.Add(Color.Wheat);
            list.Add(Color.Turquoise);
            list.Add(Color.PeachPuff);
            list.Add(Color.SkyBlue);
            list.Add(Color.Pink);
            list.Add(Color.Plum);
            list.Add(Color.PowderBlue);
            list.Add(Color.RosyBrown);
            list.Add(Color.SkyBlue);
            list.Add(Color.LightSalmon);
            list.Add(Color.LightGreen);
            list.Add(Color.LightPink);
            list.Add(Color.Aqua);
            list.Add(Color.Aquamarine);
            list.Add(Color.Bisque);
            list.Add(Color.Coral);
            list.Add(Color.BurlyWood);
            list.Add(Color.CadetBlue);
            list.Add(Color.DarkTurquoise);
            list.Add(Color.Khaki);
            list.Add(Color.Lavender);
            list.Add(Color.LavenderBlush);
            list.Add(Color.LightBlue);
            list.Add(Color.Coral);
            list.Add(Color.Navy);
            list.Add(Color.MidnightBlue);
            list.Add(Color.Olive);
            list.Add(Color.OrangeRed);
            list.Add(Color.OliveDrab);
            list.Add(Color.PaleVioletRed);
            list.Add(Color.MediumVioletRed);
            list.Add(Color.Maroon);
            list.Add(Color.MediumBlue);
            list.Add(Color.YellowGreen);
            list.Add(Color.Purple);
            list.Add(Color.Red);
            list.Add(Color.SlateBlue);
            list.Add(Color.RoyalBlue);
            list.Add(Color.Salmon);
            list.Add(Color.SeaGreen);
            list.Add(Color.Sienna);
            list.Add(Color.SaddleBrown);
            list.Add(Color.Crimson);
            list.Add(Color.DarkCyan);
            list.Add(Color.DarkGoldenrod);
            list.Add(Color.DarkGreen);
            list.Add(Color.DarkMagenta);
            list.Add(Color.DarkOliveGreen);
            list.Add(Color.DarkOrange);
            list.Add(Color.DarkOrchid);
            list.Add(Color.DarkRed);
            list.Add(Color.CornflowerBlue);
            list.Add(Color.Chocolate);
            list.Add(Color.Blue);
            list.Add(Color.BlueViolet);
            list.Add(Color.Brown);
            list.Add(Color.DarkSlateBlue);
            list.Add(Color.DarkBlue);
            list.Add(Color.HotPink);
            list.Add(Color.IndianRed);
            list.Add(Color.Indigo);
            list.Add(Color.DarkSlateGray);
            list.Add(Color.Green);
            list.Add(Color.DarkViolet);
            list.Add(Color.DeepPink);
            list.Add(Color.DeepSkyBlue);
            list.Add(Color.DodgerBlue);
            list.Add(Color.Firebrick);
            list.Add(Color.Fuchsia);
            list.Add(Color.Goldenrod);
            list.Add(Color.Gold);
            list.Add(Color.ForestGreen);

            var orderedColorList = list.OrderBy(color => color.GetHue()).ThenBy(o => o.R * 3 + o.G * 2 + o.B * 1);
            list = orderedColorList.ToList();
            return list;
        }
    }
}