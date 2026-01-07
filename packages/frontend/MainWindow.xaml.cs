using Microsoft.UI.Xaml;
using ChatApp.Views;

namespace ChatApp;

public sealed partial class MainWindow : Window
{
    public MainWindow()
    {
        InitializeComponent();
        ContentFrame.Navigate(typeof(LoginPage));
    }
}
