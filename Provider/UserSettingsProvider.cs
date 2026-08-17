using Microsoft.JSInterop;
using System.ComponentModel;
using System.Runtime.CompilerServices;

namespace CoderBasket.Blazor.Provider
{
    public sealed class UserSettingsProvider
    {
        private const string KeyName = "state";

        private readonly IJSRuntime _jsRuntime;
        private bool _initialized;
        private UserSettings _settings;

        public event EventHandler Changed;

        public bool AutoSave { get; set; } = true;

        public UserSettingsProvider(IJSRuntime jsRuntime)
        {
            _jsRuntime = jsRuntime;
        }

        public async ValueTask<UserSettings> Get()
        {
            if (_settings != null)
                return _settings;

            // Register the Storage event handler. This handler calls OnStorageUpdated when the storage changed.
            // This way, you can reload the settings when another instance of the application (tab / window) save the settings
            if (!_initialized)
            {
                // Create a reference to the current object, so the JS function can call the public method "OnStorageUpdated"
                var reference = DotNetObjectReference.Create(this);
                await _jsRuntime.InvokeVoidAsync("BlazorRegisterStorageEvent", reference);
                _initialized = true;
            }

            // Read the JSON string that contains the data from the local storage
            UserSettings result;
            var str = await _jsRuntime.InvokeAsync<string>("BlazorGetLocalStorage", KeyName);
            if (str != null)
            {
                result = System.Text.Json.JsonSerializer.Deserialize<UserSettings>(str) ?? new UserSettings();
            }
            else
            {
                result = new UserSettings();
            }

            // Register the OnPropertyChanged event, so it automatically persists the settings as soon as a value is changed
            result.PropertyChanged += OnPropertyChanged;
            _settings = result;
            return result;
        }

        public async Task Save()
        {
            var json = System.Text.Json.JsonSerializer.Serialize(_settings);
            await _jsRuntime.InvokeVoidAsync("BlazorSetLocalStorage", KeyName, json);
        }

        // Automatically persist the settings when a property changed
        private async void OnPropertyChanged(object sender, PropertyChangedEventArgs e)
        {
            if (AutoSave)
            {
                await Save();
            }
        }

        // This method is called from BlazorRegisterStorageEvent when the storage changed
        [JSInvokable]
        public void OnStorageUpdated(string key)
        {
            if (key == KeyName)
            {
                // Reset the settings. The next call to Get will reload the data
                _settings = null;
                Changed?.Invoke(this, EventArgs.Empty);
            }
        }
    }

    // The class that stores the user settings
    public class UserSettings : INotifyPropertyChanged
    {
        private string username;

        public string Username
        {
            get => username; set
            {
                username = value;
                RaisePropertyChanged();
            }
        }

        public event PropertyChangedEventHandler PropertyChanged;

        private void RaisePropertyChanged([CallerMemberName] string propertyName = null)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
        }
    }
}
