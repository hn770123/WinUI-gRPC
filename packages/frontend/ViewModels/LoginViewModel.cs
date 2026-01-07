using System;
using System.Threading.Tasks;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

namespace ChatApp.ViewModels;

public partial class LoginViewModel : ObservableObject
{
    [ObservableProperty]
    private string username = string.Empty;

    [ObservableProperty]
    private string password = string.Empty;

    [ObservableProperty]
    private string errorMessage = string.Empty;

    [ObservableProperty]
    private bool isLoading;

    public event Action? LoginSucceeded;

    [RelayCommand]
    private async Task LoginAsync()
    {
        ErrorMessage = string.Empty;

        if (string.IsNullOrWhiteSpace(Username) || string.IsNullOrWhiteSpace(Password))
        {
            ErrorMessage = "ユーザー名とパスワードを入力してください";
            return;
        }

        IsLoading = true;

        try
        {
            var (success, error) = await App.GrpcClient.LoginAsync(Username, Password);

            if (success)
            {
                LoginSucceeded?.Invoke();
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
    private async Task RegisterAsync()
    {
        ErrorMessage = string.Empty;

        if (string.IsNullOrWhiteSpace(Username) || string.IsNullOrWhiteSpace(Password))
        {
            ErrorMessage = "ユーザー名とパスワードを入力してください";
            return;
        }

        IsLoading = true;

        try
        {
            var (success, error) = await App.GrpcClient.RegisterAsync(Username, Password, Username);

            if (success)
            {
                ErrorMessage = "登録が完了しました。ログインしてください。";
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
}
