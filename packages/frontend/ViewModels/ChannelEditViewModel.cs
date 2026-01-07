using System;
using System.Collections.ObjectModel;
using System.Threading.Tasks;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using ChatApp.Models;

namespace ChatApp.ViewModels;

public partial class ChannelEditViewModel : ObservableObject
{
    [ObservableProperty]
    private ObservableCollection<Channel> channels = new();

    [ObservableProperty]
    private string newChannelName = string.Empty;

    [ObservableProperty]
    private string newChannelDescription = string.Empty;

    [ObservableProperty]
    private bool newChannelIsPrivate;

    [ObservableProperty]
    private string errorMessage = string.Empty;

    [ObservableProperty]
    private bool isLoading;

    public event Action? NavigateBack;

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
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private async Task CreateChannelAsync()
    {
        ErrorMessage = string.Empty;

        if (string.IsNullOrWhiteSpace(NewChannelName))
        {
            ErrorMessage = "チャンネル名を入力してください";
            return;
        }

        IsLoading = true;
        try
        {
            var (success, channel, error) = await App.GrpcClient.CreateChannelAsync(
                NewChannelName,
                NewChannelDescription,
                NewChannelIsPrivate
            );

            if (success && channel != null)
            {
                Channels.Add(channel);
                NewChannelName = string.Empty;
                NewChannelDescription = string.Empty;
                NewChannelIsPrivate = false;
            }
            else
            {
                ErrorMessage = error;
            }
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private async Task DeleteChannelAsync(Channel channel)
    {
        IsLoading = true;
        try
        {
            var (success, error) = await App.GrpcClient.DeleteChannelAsync(channel.Id);

            if (success)
            {
                Channels.Remove(channel);
            }
            else
            {
                ErrorMessage = error;
            }
        }
        finally
        {
            IsLoading = false;
        }
    }

    [RelayCommand]
    private void GoBack()
    {
        NavigateBack?.Invoke();
    }
}
