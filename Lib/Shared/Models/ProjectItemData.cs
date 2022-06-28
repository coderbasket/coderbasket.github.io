using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Blazor_App.Shared.Models
{
    public class ProjectItemData
    {
        public string Title { get; set; }
        public List<ProjectItem> Items { get; set; }
    }
}
