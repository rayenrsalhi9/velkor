import type { Channel } from "../../domain/entities/Channel.js";
import type { Message } from "../../domain/entities/Message.js";

export interface ChannelInput {
  name: string;
  description: string | null;
  createdById: string;
}

export interface ListMessagesParams {
  channelId: string;
  before?: string;
  limit: number;
}

export interface MessageInput {
  channelId: string;
  authorId: string;
  body: string;
}

export interface ChatRepository {
  listChannels(): Promise<Channel[]>;
  findChannelById(id: string): Promise<Channel | null>;
  findChannelByName(name: string): Promise<Channel | null>;
  createChannel(input: ChannelInput): Promise<Channel>;
  deleteChannel(id: string): Promise<void>;
  listMessages(params: ListMessagesParams): Promise<Message[]>;
  findMessageById(id: string): Promise<Message | null>;
  createMessage(input: MessageInput): Promise<Message>;
  deleteMessage(id: string): Promise<void>;
}