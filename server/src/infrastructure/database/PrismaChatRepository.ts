import { Prisma, PrismaClient } from "../../generated/prisma/client.js";
import { Channel } from "../../domain/entities/Channel.js";
import { Message } from "../../domain/entities/Message.js";
import { ChannelNotFoundError } from "../../application/errors/ChannelNotFoundError.js";
import { ChannelNameConflictError } from "../../application/errors/ChannelNameConflictError.js";
import { MessageNotFoundError } from "../../application/errors/MessageNotFoundError.js";
import type {
  ChatRepository,
  ChannelInput,
  ListMessagesParams,
  MessageInput,
} from "../../application/ports/ChatRepository.js";

export class PrismaChatRepository implements ChatRepository {
  constructor(private prisma: PrismaClient) {}

  private mapChannel(row: {
    id: string;
    name: string;
    description: string | null;
    createdById: string;
    createdAt: Date;
  }): Channel {
    return new Channel(row.id, row.name, row.description, row.createdById, row.createdAt);
  }

  private mapMessage(row: {
    id: string;
    channelId: string;
    authorId: string;
    body: string;
    createdAt: Date;
    author: { id: string; fullName: string; email: string };
  }): Message {
    return new Message(
      row.id,
      row.channelId,
      row.authorId,
      row.author.fullName,
      row.author.email,
      row.body,
      row.createdAt,
    );
  }

  async listChannels(): Promise<Channel[]> {
    const rows = await this.prisma.channel.findMany({
      where: { deletedAt: null },
      orderBy: [{ name: "asc" }, { id: "asc" }],
    });
    return rows.map((row) => this.mapChannel(row));
  }

  async findChannelById(id: string): Promise<Channel | null> {
    const row = await this.prisma.channel.findFirst({
      where: { id, deletedAt: null },
    });
    return row ? this.mapChannel(row) : null;
  }

  async findChannelByName(name: string): Promise<Channel | null> {
    const row = await this.prisma.channel.findFirst({
      where: { name, deletedAt: null },
    });
    return row ? this.mapChannel(row) : null;
  }

  async createChannel(input: ChannelInput): Promise<Channel> {
    try {
      const row = await this.prisma.channel.create({ data: input });
      return this.mapChannel(row);
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        throw new ChannelNameConflictError();
      }
      throw err;
    }
  }

  async deleteChannel(id: string): Promise<void> {
    try {
      await this.prisma.channel.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2025"
      ) {
        throw new ChannelNotFoundError();
      }
      throw err;
    }
  }

  async listMessages(params: ListMessagesParams): Promise<Message[]> {
    const { channelId, before, limit } = params;
    const rows = await this.prisma.message.findMany({
      where: {
        channelId,
        deletedAt: null,
        ...(before ? { createdAt: { lt: before } } : {}),
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit,
      include: { author: { select: { id: true, fullName: true, email: true } } },
    });
    return rows.map((row) => this.mapMessage(row));
  }

  async findMessageById(id: string): Promise<Message | null> {
    const row = await this.prisma.message.findFirst({
      where: { id, deletedAt: null },
      include: { author: { select: { id: true, fullName: true, email: true } } },
    });
    return row ? this.mapMessage(row) : null;
  }

  async createMessage(input: MessageInput): Promise<Message> {
    const row = await this.prisma.message.create({
      data: input,
      include: { author: { select: { id: true, fullName: true, email: true } } },
    });
    return this.mapMessage(row);
  }

  async deleteMessage(id: string): Promise<void> {
    try {
      await this.prisma.message.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2025"
      ) {
        throw new MessageNotFoundError();
      }
      throw err;
    }
  }
}