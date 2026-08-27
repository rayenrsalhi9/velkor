import type { ChatRepository } from "../ports/ChatRepository.js";
import { ChannelNotFoundError } from "../errors/ChannelNotFoundError.js";
import { NotChannelOwnerError } from "../errors/NotChannelOwnerError.js";

export interface ChannelActor {
  userId: string;
  isAdmin: boolean;
}

export class DeleteChannel {
  constructor(private chatRepository: ChatRepository) {}

  async execute(channelId: string, actor: ChannelActor): Promise<void> {
    const channel = await this.chatRepository.findChannelById(channelId);
    if (!channel) {
      throw new ChannelNotFoundError();
    }
    if (channel.createdById !== actor.userId && !actor.isAdmin) {
      throw new NotChannelOwnerError();
    }
    await this.chatRepository.deleteChannel(channelId);
  }
}