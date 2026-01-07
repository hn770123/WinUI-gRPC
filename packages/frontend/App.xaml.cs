using Microsoft.UI.Xaml;
using ChatApp.Services;

namespace ChatApp;

public partial class App : Application
{
    public static GrpcClientService GrpcClient { get; private set; } = null!;

    public App()
    {
        InitializeComponent();
        GrpcClient = new GrpcClientService("http://localhost:50051");
    }

    protected override void OnLaunched(LaunchActivatedEventArgs args)
    {
        m_window = new MainWindow();
        m_window.Activate();
    }

    private Window? m_window;
}
