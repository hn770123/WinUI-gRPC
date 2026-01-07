using System;
using System.Collections.ObjectModel;
using System.Threading.Tasks;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using ChatApp.Models;

namespace ChatApp.ViewModels;

public partial class UserManagementViewModel : ObservableObject
{
    [ObservableProperty]
    private ObservableCollection<User> users = new();

    [ObservableProperty]
    private bool isLoading;

    public event Action? NavigateBack;

    public async Task InitializeAsync()
    {
        await LoadUsersAsync();
    }

    [RelayCommand]
    private async Task LoadUsersAsync()
    {
        IsLoading = true;
        try
        {
            var userList = await App.GrpcClient.GetUsersAsync();
            Users.Clear();
            foreach (var user in userList)
            {
                Users.Add(user);
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
