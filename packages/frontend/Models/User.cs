namespace ChatApp.Models;

public class User
{
    public string Id { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public long CreatedAt { get; set; }
    public bool IsActive { get; set; }
}
