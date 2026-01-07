export interface User {
  id: string;
  username: string;
  passwordHash: string;
  displayName: string;
  createdAt: number;
  isActive: boolean;
}

export interface Channel {
  id: string;
  name: string;
  description: string;
  createdAt: number;
  createdBy: string;
  memberIds: string[];
  isPrivate: boolean;
}

export interface Message {
  id: string;
  channelId: string;
  userId: string;
  username: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface Session {
  token: string;
  userId: string;
  createdAt: number;
}
