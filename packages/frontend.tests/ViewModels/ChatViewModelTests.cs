using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ChatApp.Models;
using ChatApp.Services;
using ChatApp.ViewModels;
using Moq;
using Xunit;

namespace ChatApp.Tests.ViewModels;

/// <summary>
/// ChatViewModelのユニットテスト
/// 注意: このテストは理想的な実装例です
/// 実際のChatViewModelは静的なApp.GrpcClientに依存しているため、
/// 本番環境では依存性注入を使用するようにリファクタリングすることを推奨します
/// </summary>
public class ChatViewModelTests
{
    [Fact]
    public void Constructor_ShouldInitializeCollections()
    {
        // Arrange & Act
        var viewModel = new ChatViewModel();

        // Assert
        Assert.NotNull(viewModel.Channels);
        Assert.Empty(viewModel.Channels);
        Assert.NotNull(viewModel.Messages);
        Assert.Empty(viewModel.Messages);
        Assert.Null(viewModel.SelectedChannel);
        Assert.Equal(string.Empty, viewModel.NewMessage);
        Assert.False(viewModel.IsLoading);
    }

    [Fact]
    public void SelectedChannel_WhenChanged_ShouldUpdateProperty()
    {
        // Arrange
        var viewModel = new ChatViewModel();
        var testChannel = new Channel
        {
            Id = "channel-1",
            Name = "Test Channel",
            Description = "Test Description",
            CreatedAt = DateTimeOffset.Now.ToUnixTimeMilliseconds(),
            CreatedBy = "user-1",
            MemberIds = new List<string> { "user-1" },
            IsPrivate = false
        };

        // Act
        viewModel.SelectedChannel = testChannel;

        // Assert
        Assert.Equal(testChannel, viewModel.SelectedChannel);
    }

    // 以下のテストは、ViewModelが依存性注入をサポートする場合の実装例です
    // 現在の実装では静的なApp.GrpcClientを使用しているため、これらのテストは参考例として提供されています

    /*
    [Fact]
    public async Task LoadChannelsAsync_ShouldPopulateChannelsList()
    {
        // Arrange
        var mockGrpcClient = new Mock<IGrpcClientService>();
        var testChannels = new List<Channel>
        {
            new Channel
            {
                Id = "channel-1",
                Name = "General",
                Description = "General chat",
                CreatedAt = DateTimeOffset.Now.ToUnixTimeMilliseconds(),
                CreatedBy = "user-1",
                MemberIds = new List<string> { "user-1" },
                IsPrivate = false
            },
            new Channel
            {
                Id = "channel-2",
                Name = "Random",
                Description = "Random chat",
                CreatedAt = DateTimeOffset.Now.ToUnixTimeMilliseconds(),
                CreatedBy = "user-1",
                MemberIds = new List<string> { "user-1" },
                IsPrivate = false
            }
        };

        mockGrpcClient
            .Setup(x => x.GetChannelsAsync())
            .ReturnsAsync(testChannels);

        var viewModel = new ChatViewModel(mockGrpcClient.Object);

        // Act
        await viewModel.LoadChannelsCommand.ExecuteAsync(null);

        // Assert
        Assert.Equal(2, viewModel.Channels.Count);
        Assert.Equal("General", viewModel.Channels[0].Name);
        Assert.Equal("Random", viewModel.Channels[1].Name);
        Assert.NotNull(viewModel.SelectedChannel);
        Assert.Equal("channel-1", viewModel.SelectedChannel.Id);
        Assert.False(viewModel.IsLoading);
    }

    [Fact]
    public async Task LoadChannelsAsync_WithNoChannels_ShouldClearList()
    {
        // Arrange
        var mockGrpcClient = new Mock<IGrpcClientService>();
        mockGrpcClient
            .Setup(x => x.GetChannelsAsync())
            .ReturnsAsync(new List<Channel>());

        var viewModel = new ChatViewModel(mockGrpcClient.Object);

        // Act
        await viewModel.LoadChannelsCommand.ExecuteAsync(null);

        // Assert
        Assert.Empty(viewModel.Channels);
        Assert.Null(viewModel.SelectedChannel);
        Assert.False(viewModel.IsLoading);
    }

    [Fact]
    public async Task LoadMessagesAsync_WhenChannelSelected_ShouldPopulateMessagesList()
    {
        // Arrange
        var mockGrpcClient = new Mock<IGrpcClientService>();
        var testChannel = new Channel
        {
            Id = "channel-1",
            Name = "Test Channel",
            Description = "Test Description",
            CreatedAt = DateTimeOffset.Now.ToUnixTimeMilliseconds(),
            CreatedBy = "user-1",
            MemberIds = new List<string> { "user-1" },
            IsPrivate = false
        };

        var testMessages = new List<Message>
        {
            new Message
            {
                Id = "msg-1",
                ChannelId = "channel-1",
                UserId = "user-1",
                Username = "User 1",
                Content = "Hello",
                CreatedAt = DateTimeOffset.Now.ToUnixTimeMilliseconds(),
                UpdatedAt = DateTimeOffset.Now.ToUnixTimeMilliseconds()
            },
            new Message
            {
                Id = "msg-2",
                ChannelId = "channel-1",
                UserId = "user-2",
                Username = "User 2",
                Content = "Hi there!",
                CreatedAt = DateTimeOffset.Now.AddMinutes(1).ToUnixTimeMilliseconds(),
                UpdatedAt = DateTimeOffset.Now.AddMinutes(1).ToUnixTimeMilliseconds()
            }
        };

        mockGrpcClient
            .Setup(x => x.GetMessagesAsync("channel-1", 100))
            .ReturnsAsync(testMessages);

        var viewModel = new ChatViewModel(mockGrpcClient.Object);

        // Act
        viewModel.SelectedChannel = testChannel;
        await Task.Delay(100); // SelectedChannelChanged処理を待つ

        // Assert
        Assert.Equal(2, viewModel.Messages.Count);
        Assert.Equal("Hello", viewModel.Messages[0].Content);
        Assert.Equal("Hi there!", viewModel.Messages[1].Content);
    }

    [Fact]
    public async Task SendMessageAsync_WithValidContent_ShouldCallGrpcClient()
    {
        // Arrange
        var mockGrpcClient = new Mock<IGrpcClientService>();
        var testChannel = new Channel
        {
            Id = "channel-1",
            Name = "Test Channel",
            Description = "Test Description",
            CreatedAt = DateTimeOffset.Now.ToUnixTimeMilliseconds(),
            CreatedBy = "user-1",
            MemberIds = new List<string> { "user-1" },
            IsPrivate = false
        };

        mockGrpcClient
            .Setup(x => x.SendMessageAsync("channel-1", "Test message"))
            .ReturnsAsync((true, string.Empty));

        var viewModel = new ChatViewModel(mockGrpcClient.Object)
        {
            SelectedChannel = testChannel,
            NewMessage = "Test message"
        };

        // Act
        await viewModel.SendMessageCommand.ExecuteAsync(null);

        // Assert
        mockGrpcClient.Verify(x => x.SendMessageAsync("channel-1", "Test message"), Times.Once);
        Assert.Equal(string.Empty, viewModel.NewMessage);
    }

    [Fact]
    public async Task SendMessageAsync_WithEmptyMessage_ShouldNotCallGrpcClient()
    {
        // Arrange
        var mockGrpcClient = new Mock<IGrpcClientService>();
        var testChannel = new Channel
        {
            Id = "channel-1",
            Name = "Test Channel",
            Description = "Test Description",
            CreatedAt = DateTimeOffset.Now.ToUnixTimeMilliseconds(),
            CreatedBy = "user-1",
            MemberIds = new List<string> { "user-1" },
            IsPrivate = false
        };

        var viewModel = new ChatViewModel(mockGrpcClient.Object)
        {
            SelectedChannel = testChannel,
            NewMessage = string.Empty
        };

        // Act
        await viewModel.SendMessageCommand.ExecuteAsync(null);

        // Assert
        mockGrpcClient.Verify(x => x.SendMessageAsync(It.IsAny<string>(), It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task SendMessageAsync_WithoutSelectedChannel_ShouldNotCallGrpcClient()
    {
        // Arrange
        var mockGrpcClient = new Mock<IGrpcClientService>();
        var viewModel = new ChatViewModel(mockGrpcClient.Object)
        {
            NewMessage = "Test message"
        };

        // Act
        await viewModel.SendMessageCommand.ExecuteAsync(null);

        // Assert
        mockGrpcClient.Verify(x => x.SendMessageAsync(It.IsAny<string>(), It.IsAny<string>()), Times.Never);
    }
    */
}
