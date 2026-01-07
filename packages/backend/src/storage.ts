import { User, Channel, Message, Session } from './types';
import { db } from './database';

// SQLiteベースのストレージ実装
class Storage {
  // ユーザー操作
  addUser(user: User): void {
    const stmt = db.prepare(`
      INSERT INTO users (id, username, password_hash, display_name, created_at, is_active)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(user.id, user.username, user.passwordHash, user.displayName, user.createdAt, user.isActive ? 1 : 0);
  }

  getUserById(id: string): User | undefined {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    const row = stmt.get(id) as any;
    return row ? this.mapRowToUser(row) : undefined;
  }

  getUserByUsername(username: string): User | undefined {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    const row = stmt.get(username) as any;
    return row ? this.mapRowToUser(row) : undefined;
  }

  getAllUsers(): User[] {
    const stmt = db.prepare('SELECT * FROM users');
    const rows = stmt.all() as any[];
    return rows.map(row => this.mapRowToUser(row));
  }

  updateUser(user: User): void {
    const stmt = db.prepare(`
      UPDATE users
      SET username = ?, password_hash = ?, display_name = ?, is_active = ?
      WHERE id = ?
    `);
    stmt.run(user.username, user.passwordHash, user.displayName, user.isActive ? 1 : 0, user.id);
  }

  deleteUser(id: string): boolean {
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  private mapRowToUser(row: any): User {
    return {
      id: row.id,
      username: row.username,
      passwordHash: row.password_hash,
      displayName: row.display_name,
      createdAt: row.created_at,
      isActive: row.is_active === 1
    };
  }

  // セッション操作
  addSession(session: Session): void {
    const stmt = db.prepare(`
      INSERT INTO sessions (token, user_id, created_at)
      VALUES (?, ?, ?)
    `);
    stmt.run(session.token, session.userId, session.createdAt);
  }

  getSession(token: string): Session | undefined {
    const stmt = db.prepare('SELECT * FROM sessions WHERE token = ?');
    const row = stmt.get(token) as any;
    return row ? this.mapRowToSession(row) : undefined;
  }

  deleteSession(token: string): boolean {
    const stmt = db.prepare('DELETE FROM sessions WHERE token = ?');
    const result = stmt.run(token);
    return result.changes > 0;
  }

  private mapRowToSession(row: any): Session {
    return {
      token: row.token,
      userId: row.user_id,
      createdAt: row.created_at
    };
  }

  // チャンネル操作
  addChannel(channel: Channel): void {
    const insertChannel = db.prepare(`
      INSERT INTO channels (id, name, description, created_at, created_by, is_private)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertMember = db.prepare(`
      INSERT INTO channel_members (channel_id, user_id, joined_at)
      VALUES (?, ?, ?)
    `);

    // トランザクションで実行
    const transaction = db.transaction(() => {
      insertChannel.run(
        channel.id,
        channel.name,
        channel.description,
        channel.createdAt,
        channel.createdBy,
        channel.isPrivate ? 1 : 0
      );

      // メンバーを追加
      const now = Date.now();
      for (const memberId of channel.memberIds) {
        insertMember.run(channel.id, memberId, now);
      }
    });

    transaction();
  }

  getChannelById(id: string): Channel | undefined {
    const stmt = db.prepare('SELECT * FROM channels WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return undefined;

    const memberStmt = db.prepare('SELECT user_id FROM channel_members WHERE channel_id = ?');
    const memberRows = memberStmt.all(id) as any[];
    const memberIds = memberRows.map(r => r.user_id);

    return this.mapRowToChannel(row, memberIds);
  }

  getAllChannels(): Channel[] {
    const stmt = db.prepare('SELECT * FROM channels');
    const rows = stmt.all() as any[];

    return rows.map(row => {
      const memberStmt = db.prepare('SELECT user_id FROM channel_members WHERE channel_id = ?');
      const memberRows = memberStmt.all(row.id) as any[];
      const memberIds = memberRows.map(r => r.user_id);
      return this.mapRowToChannel(row, memberIds);
    });
  }

  getChannelsByUserId(userId: string): Channel[] {
    const stmt = db.prepare(`
      SELECT c.* FROM channels c
      INNER JOIN channel_members cm ON c.id = cm.channel_id
      WHERE cm.user_id = ?
    `);
    const rows = stmt.all(userId) as any[];

    return rows.map(row => {
      const memberStmt = db.prepare('SELECT user_id FROM channel_members WHERE channel_id = ?');
      const memberRows = memberStmt.all(row.id) as any[];
      const memberIds = memberRows.map(r => r.user_id);
      return this.mapRowToChannel(row, memberIds);
    });
  }

  updateChannel(channel: Channel): void {
    const updateChannel = db.prepare(`
      UPDATE channels
      SET name = ?, description = ?, is_private = ?
      WHERE id = ?
    `);

    const deleteMembersStmt = db.prepare('DELETE FROM channel_members WHERE channel_id = ?');
    const insertMemberStmt = db.prepare(`
      INSERT INTO channel_members (channel_id, user_id, joined_at)
      VALUES (?, ?, ?)
    `);

    // トランザクションで実行
    const transaction = db.transaction(() => {
      updateChannel.run(channel.name, channel.description, channel.isPrivate ? 1 : 0, channel.id);

      // 既存のメンバーを削除して再追加
      deleteMembersStmt.run(channel.id);
      const now = Date.now();
      for (const memberId of channel.memberIds) {
        insertMemberStmt.run(channel.id, memberId, now);
      }
    });

    transaction();
  }

  deleteChannel(id: string): boolean {
    const stmt = db.prepare('DELETE FROM channels WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  private mapRowToChannel(row: any, memberIds: string[]): Channel {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      createdAt: row.created_at,
      createdBy: row.created_by,
      memberIds: memberIds,
      isPrivate: row.is_private === 1
    };
  }

  // メッセージ操作
  addMessage(message: Message): void {
    const stmt = db.prepare(`
      INSERT INTO messages (id, channel_id, user_id, username, content, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      message.id,
      message.channelId,
      message.userId,
      message.username,
      message.content,
      message.createdAt,
      message.updatedAt
    );
  }

  getMessageById(id: string): Message | undefined {
    const stmt = db.prepare('SELECT * FROM messages WHERE id = ?');
    const row = stmt.get(id) as any;
    return row ? this.mapRowToMessage(row) : undefined;
  }

  getMessagesByChannelId(channelId: string, limit: number = 100, before?: number): Message[] {
    let sql = 'SELECT * FROM messages WHERE channel_id = ?';
    const params: any[] = [channelId];

    if (before) {
      sql += ' AND created_at < ?';
      params.push(before);
    }

    sql += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    const stmt = db.prepare(sql);
    const rows = stmt.all(...params) as any[];
    return rows.map(row => this.mapRowToMessage(row));
  }

  deleteMessage(id: string): boolean {
    const stmt = db.prepare('DELETE FROM messages WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  private mapRowToMessage(row: any): Message {
    return {
      id: row.id,
      channelId: row.channel_id,
      userId: row.user_id,
      username: row.username,
      content: row.content,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

export const storage = new Storage();
