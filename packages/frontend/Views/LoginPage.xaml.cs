using Microsoft.UI.Xaml.Controls;
using ChatApp.ViewModels;

namespace ChatApp.Views;

public sealed partial class LoginPage : Page
{
    public LoginViewModel ViewModel { get; }

    public LoginPage()
    {
        InitializeComponent();
        ViewModel = new LoginViewModel();
        ViewModel.LoginSucceeded += OnLoginSucceeded;
    }

    private void OnLoginSucceeded()
    {
        Frame.Navigate(typeof(ChatPage));
    }
}
