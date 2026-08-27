import type {
  ChatRepository,
  ChannelInput,
  MessageInput,
} from "../ports/ChatRepository.js";
import { Channel } from "../../domain/entities/Channel.js";
import { Message } from "../../domain/entities/Message.js";

export interface FakeChatCalls {
  createChannel: ChannelInput[];
  createMessage: MessageInput[];
  deleteChannel: string[];
  deleteMessage: string[];
}

export function makeChatRepository(
  overrides: Partial<ChatRepository> = {},
): { repository: ChatRepository; calls: FakeChatCalls } {
  const calls: FakeChatCalls = {
    createChannel: [],
    createMessage: [],
    deleteChannel: [],
    deleteMessage: [],
  };
  const repository: ChatRepository = {
    async listChannels() {
      return [];
    },
    async findChannelById() {
      return null;
    },
    async findChannelByName() {
      return null;
    },
    async createChannel(input) {
      calls.createChannel.push(input);
      return new Channel("ch1", input.name, input.description, input.createdById);
    },
    async deleteChannel(id) {
      calls.deleteChannel.push(id);
    },
    async listMessages() {
      return [];
    },
    async findMessageById() {
      return null;
    },
    async createMessage(input) {
      calls.createMessage.push(input);
      return new Message(
        "m1",
        input.channelId,
        input.authorId,
        "Ada Lovelace",
        "ada@velkor.local",
        input.body,
      );
    },
    async deleteMessage(id) {
      calls.deleteMessage.push(id);
    },
    ...overrides,
  };
  return { repository, calls };
}

export function channel(id: string, overrides: Partial<Channel> = {}): Channel {
  return new Channel(
    id,
    overrides.name ?? "General",
    overrides.description ?? null,
    overrides.createdById ?? "u1",
    overrides.createdAt ?? new Date(),
  );
}

export function message(
  id: string,
  overrides: Partial<Message> = {},
): Message {
  return new Message(
    id,
    overrides.channelId ?? "ch1",
    overrides.authorId ?? "u1",
    overrides.authorName ?? "Ada Lovelace",
    overrides.authorEmail ?? "ada@velkor.local",
    overrides.body ?? "hello",
    overrides.createdAt ?? new Date(),
  );
}