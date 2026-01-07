import { User, Channel, Message, Session } from './types';

// インメモリストレージ（実運用ではデータベースを使用）
class Storage {
  private users: Map<string, User> = new Map();
  private channels: Map<string, Channel> = new Map();
  private messages: Map<string, Message> = new Map();
  private sessions: Map<string, Session> = new Map();
  private usersByUsername: Map<string, User> = new Map();

  // ユーザー操作
  addUser(user: User): void {
    this.users.set(user.id, user);
    this.usersByUsername.set(user.username, user);
  }

  getUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  getUserByUsername(username: string): User | undefined {
    return this.usersByUsername.get(username);
  }

  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  updateUser(user: User): void {
    this.users.set(user.id, user);
    this.usersByUsername.set(user.username, user);
  }

  deleteUser(id: string): boolean {
    const user = this.users.get(id);
    if (!user) return false;
    this.usersByUsername.delete(user.username);
    return this.users.delete(id);
  }

  // セッション操作
  addSession(session: Session): void {
    this.sessions.set(session.token, session);
  }

  getSession(token: string): Session | undefined {
    return this.sessions.get(token);
  }

  deleteSession(token: string): boolean {
    return this.sessions.delete(token);
  }

  // チャンネル操作
  addChannel(channel: Channel): void {
    this.channels.set(channel.id, channel);
  }

  getChannelById(id: string): Channel | undefined {
    return this.channels.get(id);
  }

  getAllChannels(): Channel[] {
    return Array.from(this.channels.values());
  }

  getChannelsByUserId(userId: string): Channel[] {
    return Array.from(this.channels.values()).filter(
      channel => channel.memberIds.includes(userId)
    );
  }

  updateChannel(channel: Channel): void {
    this.channels.set(channel.id, channel);
  }

  deleteChannel(id: string): boolean {
    return this.channels.delete(id);
  }

  // メッセージ操作
  addMessage(message: Message): void {
    this.messages.set(message.id, message);
  }

  getMessageById(id: string): Message | undefined {
    return this.messages.get(id);
  }

  getMessagesByChannelId(channelId: string, limit: number = 100, before?: number): Message[] {
    let messages = Array.from(this.messages.values())
      .filter(msg => msg.channelId === channelId);

    if (before) {
      messages = messages.filter(msg => msg.createdAt < before);
    }

    return messages
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }

  deleteMessage(id: string): boolean {
    return this.messages.delete(id);
  }
}

export const storage = new Storage();
