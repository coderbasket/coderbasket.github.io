﻿using Blazor_App.Shared.Enums;
using Blazor_App.Shared.Models;
using System;

namespace Blazor_App.Shared
{
    public class BlazorServer
    {
        public static ProjectItemData GetProjectItemData()
        {
            ProjectItemData projectItemData = new ProjectItemData();
            projectItemData.Title = "Blazor";
            projectItemData.Items = new List<ProjectItem>()
            {
                new ProjectItem()
                {
                    Title="FormsAndBindings",
                    ProjectUrl = "https://github.com/shahedc/FormsAndBindings",
                    Description = "ASP .NET Core HTML Forms and Bindings",
                    Categories = new List<Category>() {Category.LOGIN},
                    ImageUrls = new List<string>()
                    {
                        "https://wakeupandcode.com/wp-content/uploads/2019/02/Forms-Bindings.png",
                    }
                },
                new ProjectItem()
                {
                    Title="BlazingChat",
                    ProjectUrl = "https://github.com/CuriousDrive/BlazingChat",
                    Description = "BlazingChat is a Blazor WebAssembly app developed by CuriousDrive for the community. This is a sample application for developers who are just getting started with Blazor. BlazingChat has code samples for Authentication, Logging, Virtualization ... and much more. The app is open source and running in production.",
                    Categories = new List<Category>() {Category.COMMENTS},
                    ImageUrls = new List<string>()
                    {
                        "https://github.com/CuriousDrive/BlazingChat/raw/main/Source%20Code%20By%20Episodes/Documents/Gifs/Intro2.gif",
                    }
                },

            };
            return projectItemData;
        }
    }
}
