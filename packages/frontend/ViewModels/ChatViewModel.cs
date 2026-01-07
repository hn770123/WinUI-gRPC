using System;
using System.Collections.ObjectModel;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using ChatApp.Models;

namespace ChatApp.ViewModels;

public partial class ChatViewModel : ObservableObject
{
    [ObservableProperty]
    private ObservableCollection<Channel> channels = new();

    [ObservableProperty]
    private ObservableCollection<Message> messages = new();

    [ObservableProperty]
    private Channel? selectedChannel;

    [ObservableProperty]
    private string newMessage = string.Empty;

    [ObservableProperty]
    private bool isLoading;

    private CancellationTokenSource? _subscriptionCts;

    public event Action? NavigateToChannelEdit;
    public event Action? NavigateToUserManagement;

    public async Task InitializeAsync()
    {
        await LoadChannelsAsync();
    }

    [RelayCommand]
    private async Task LoadChannelsAsync()
    {
        IsLoading = true;
        try
        {
            var channelList = await App.GrpcClient.GetChannelsAsync();
            Channels.Clear();
            foreach (var channel in channelList)
            {
                Channels.Add(channel);
            }

            if (SelectedChannel == null && Channels.Any())
            {
                SelectedChannel = Channels[0];
            }
        }
        finally
        {
            IsLoading = false;
        }
    }

    partial void OnSelectedChannelChanged(Channel? value)
    {
        if (value != null)
        {
            _ = LoadMessagesAsync();
        }
    }

    private async Task LoadMessagesAsync()
    {
        if (SelectedChannel == null)
            return;

        // 既存のサブスクリプションをキャンセル
        _subscriptionCts?.Cancel();
        _subscriptionCts?.Dispose();

        IsLoading = true;
        try
        {
            var messageList = await App.GrpcClient.GetMessagesAsync(SelectedChannel.Id);
            Messages.Clear();
            foreach (var message in messageList.OrderBy(m => m.CreatedAt))
            {
                Messages.Add(message);
            }

            // 新しいメッセージのサブスクリプション開始
            _subscriptionCts = new CancellationTokenSource();
            _ = SubscribeToMessagesAsync(_subscriptionCts.Token);
        }
        finally
        {
            IsLoading = false;
        }
    }

    private async Task SubscribeToMessagesAsync(CancellationToken cancellationToken)
    {
        if (SelectedChannel == null)
            return;

        await App.GrpcClient.SubscribeToMessagesAsync(
            SelectedChannel.Id,
            message =>
            {
                // UIスレッドで実行
                Microsoft.UI.Dispatching.DispatcherQueue.GetForCurrentThread()?.TryEnqueue(() =>
                {
                    Messages.Add(message);
                });
            },
            cancellationToken
        );
    }

    [RelayCommand]
    private async Task SendMessageAsync()
    {
        if (SelectedChannel == null || string.IsNullOrWhiteSpace(NewMessage))
            return;

        var content = NewMessage;
        NewMessage = string.Empty;

        var (success, error) = await App.GrpcClient.SendMessageAsync(SelectedChannel.Id, content);

        if (!success)
        {
            // エラーハンドリング
            NewMessage = content;
        }
    }

    [RelayCommand]
    private void OpenChannelEdit()
    {
        NavigateToChannelEdit?.Invoke();
    }

    [RelayCommand]
    private void OpenUserManagement()
    {
        NavigateToUserManagement?.Invoke();
    }

    public void Cleanup()
    {
        _subscriptionCts?.Cancel();
        _subscriptionCts?.Dispose();
    }
}
