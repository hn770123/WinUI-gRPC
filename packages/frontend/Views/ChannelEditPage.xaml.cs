using Microsoft.UI.Xaml.Controls;
using ChatApp.ViewModels;

namespace ChatApp.Views;

public sealed partial class ChannelEditPage : Page
{
    public ChannelEditViewModel ViewModel { get; }

    public ChannelEditPage()
    {
        InitializeComponent();
        ViewModel = new ChannelEditViewModel();
        ViewModel.NavigateBack += OnNavigateBack;
        _ = ViewModel.InitializeAsync();
    }

    private void OnNavigateBack()
    {
        Frame.GoBack();
    }
}
