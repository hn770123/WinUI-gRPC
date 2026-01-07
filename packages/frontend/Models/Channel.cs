using System.Collections.Generic;

namespace ChatApp.Models;

public class Channel
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public long CreatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public List<string> MemberIds { get; set; } = new();
    public bool IsPrivate { get; set; }
}
