using Microsoft.UI.Xaml;
using Microsoft.UI.Xaml.Controls;
using Microsoft.UI.Xaml.Input;
using ChatApp.ViewModels;

namespace ChatApp.Views;

public sealed partial class ChatPage : Page
{
    public ChatViewModel ViewModel { get; }

    public ChatPage()
    {
        InitializeComponent();
        ViewModel = new ChatViewModel();
        ViewModel.NavigateToChannelEdit += OnNavigateToChannelEdit;
        ViewModel.NavigateToUserManagement += OnNavigateToUserManagement;
        _ = ViewModel.InitializeAsync();
    }

    private void OnNavigateToChannelEdit()
    {
        Frame.Navigate(typeof(ChannelEditPage));
    }

    private void OnNavigateToUserManagement()
    {
        Frame.Navigate(typeof(UserManagementPage));
    }

    private void MessageTextBox_KeyDown(object sender, KeyRoutedEventArgs e)
    {
        if (e.Key == Windows.System.VirtualKey.Enter && !string.IsNullOrWhiteSpace(ViewModel.NewMessage))
        {
            ViewModel.SendMessageCommand.Execute(null);
            e.Handled = true;
        }
    }
}
