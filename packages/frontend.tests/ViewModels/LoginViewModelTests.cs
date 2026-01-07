using System;
using System.Threading.Tasks;
using ChatApp.Models;
using ChatApp.Services;
using ChatApp.ViewModels;
using Moq;
using Xunit;

namespace ChatApp.Tests.ViewModels;

/// <summary>
/// LoginViewModelのユニットテスト
/// 注意: このテストは理想的な実装例です
/// 実際のLoginViewModelは静的なApp.GrpcClientに依存しているため、
/// 本番環境では依存性注入を使用するようにリファクタリングすることを推奨します
/// </summary>
public class LoginViewModelTests
{
    [Fact]
    public void Constructor_ShouldInitializeProperties()
    {
        // Arrange & Act
        var viewModel = new LoginViewModel();

        // Assert
        Assert.Equal(string.Empty, viewModel.Username);
        Assert.Equal(string.Empty, viewModel.Password);
        Assert.Equal(string.Empty, viewModel.ErrorMessage);
        Assert.False(viewModel.IsLoading);
    }

    [Fact]
    public void Username_WhenChanged_ShouldUpdateProperty()
    {
        // Arrange
        var viewModel = new LoginViewModel();
        var testUsername = "testuser";

        // Act
        viewModel.Username = testUsername;

        // Assert
        Assert.Equal(testUsername, viewModel.Username);
    }

    [Fact]
    public void Password_WhenChanged_ShouldUpdateProperty()
    {
        // Arrange
        var viewModel = new LoginViewModel();
        var testPassword = "testpassword";

        // Act
        viewModel.Password = testPassword;

        // Assert
        Assert.Equal(testPassword, viewModel.Password);
    }

    [Fact]
    public void ErrorMessage_WhenChanged_ShouldUpdateProperty()
    {
        // Arrange
        var viewModel = new LoginViewModel();
        var testError = "Test error message";

        // Act
        viewModel.ErrorMessage = testError;

        // Assert
        Assert.Equal(testError, viewModel.ErrorMessage);
    }

    [Fact]
    public void IsLoading_WhenChanged_ShouldUpdateProperty()
    {
        // Arrange
        var viewModel = new LoginViewModel();

        // Act
        viewModel.IsLoading = true;

        // Assert
        Assert.True(viewModel.IsLoading);
    }

    // 以下のテストは、ViewModelが依存性注入をサポートする場合の実装例です
    // 現在の実装では静的なApp.GrpcClientを使用しているため、これらのテストは参考例として提供されています

    /*
    [Fact]
    public async Task LoginAsync_WithValidCredentials_ShouldSucceed()
    {
        // Arrange
        var mockGrpcClient = new Mock<IGrpcClientService>();
        var testUser = new User
        {
            Id = "user-1",
            Username = "testuser",
            DisplayName = "Test User",
            CreatedAt = DateTimeOffset.Now.ToUnixTimeMilliseconds(),
            IsActive = true
        };

        mockGrpcClient
            .Setup(x => x.LoginAsync("testuser", "password123"))
            .ReturnsAsync((true, string.Empty));

        var viewModel = new LoginViewModel(mockGrpcClient.Object)
        {
            Username = "testuser",
            Password = "password123"
        };

        var loginSucceededCalled = false;
        viewModel.LoginSucceeded += () => loginSucceededCalled = true;

        // Act
        await viewModel.LoginCommand.ExecuteAsync(null);

        // Assert
        Assert.True(loginSucceededCalled);
        Assert.Equal(string.Empty, viewModel.ErrorMessage);
        Assert.False(viewModel.IsLoading);
    }

    [Fact]
    public async Task LoginAsync_WithInvalidCredentials_ShouldShowError()
    {
        // Arrange
        var mockGrpcClient = new Mock<IGrpcClientService>();
        mockGrpcClient
            .Setup(x => x.LoginAsync("testuser", "wrongpassword"))
            .ReturnsAsync((false, "ユーザー名またはパスワードが正しくありません"));

        var viewModel = new LoginViewModel(mockGrpcClient.Object)
        {
            Username = "testuser",
            Password = "wrongpassword"
        };

        // Act
        await viewModel.LoginCommand.ExecuteAsync(null);

        // Assert
        Assert.Equal("ユーザー名またはパスワードが正しくありません", viewModel.ErrorMessage);
        Assert.False(viewModel.IsLoading);
    }

    [Fact]
    public async Task LoginAsync_WithEmptyUsername_ShouldShowValidationError()
    {
        // Arrange
        var mockGrpcClient = new Mock<IGrpcClientService>();
        var viewModel = new LoginViewModel(mockGrpcClient.Object)
        {
            Username = string.Empty,
            Password = "password123"
        };

        // Act
        await viewModel.LoginCommand.ExecuteAsync(null);

        // Assert
        Assert.Equal("ユーザー名とパスワードを入力してください", viewModel.ErrorMessage);
        Assert.False(viewModel.IsLoading);
        mockGrpcClient.Verify(x => x.LoginAsync(It.IsAny<string>(), It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task LoginAsync_WithEmptyPassword_ShouldShowValidationError()
    {
        // Arrange
        var mockGrpcClient = new Mock<IGrpcClientService>();
        var viewModel = new LoginViewModel(mockGrpcClient.Object)
        {
            Username = "testuser",
            Password = string.Empty
        };

        // Act
        await viewModel.LoginCommand.ExecuteAsync(null);

        // Assert
        Assert.Equal("ユーザー名とパスワードを入力してください", viewModel.ErrorMessage);
        Assert.False(viewModel.IsLoading);
        mockGrpcClient.Verify(x => x.LoginAsync(It.IsAny<string>(), It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task RegisterAsync_WithValidData_ShouldShowSuccessMessage()
    {
        // Arrange
        var mockGrpcClient = new Mock<IGrpcClientService>();
        mockGrpcClient
            .Setup(x => x.RegisterAsync("newuser", "password123", "newuser"))
            .ReturnsAsync((true, string.Empty));

        var viewModel = new LoginViewModel(mockGrpcClient.Object)
        {
            Username = "newuser",
            Password = "password123"
        };

        // Act
        await viewModel.RegisterCommand.ExecuteAsync(null);

        // Assert
        Assert.Equal("登録が完了しました。ログインしてください。", viewModel.ErrorMessage);
        Assert.False(viewModel.IsLoading);
    }

    [Fact]
    public async Task RegisterAsync_WithExistingUsername_ShouldShowError()
    {
        // Arrange
        var mockGrpcClient = new Mock<IGrpcClientService>();
        mockGrpcClient
            .Setup(x => x.RegisterAsync("existinguser", "password123", "existinguser"))
            .ReturnsAsync((false, "このユーザー名は既に使用されています"));

        var viewModel = new LoginViewModel(mockGrpcClient.Object)
        {
            Username = "existinguser",
            Password = "password123"
        };

        // Act
        await viewModel.RegisterCommand.ExecuteAsync(null);

        // Assert
        Assert.Equal("このユーザー名は既に使用されています", viewModel.ErrorMessage);
        Assert.False(viewModel.IsLoading);
    }
    */
}
