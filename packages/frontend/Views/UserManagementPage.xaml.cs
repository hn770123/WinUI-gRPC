using Microsoft.UI.Xaml.Controls;
using ChatApp.ViewModels;

namespace ChatApp.Views;

public sealed partial class UserManagementPage : Page
{
    public UserManagementViewModel ViewModel { get; }

    public UserManagementPage()
    {
        InitializeComponent();
        ViewModel = new UserManagementViewModel();
        ViewModel.NavigateBack += OnNavigateBack;
        _ = ViewModel.InitializeAsync();
    }

    private void OnNavigateBack()
    {
        Frame.GoBack();
    }
}
