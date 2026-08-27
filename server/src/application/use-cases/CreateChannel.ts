import type { ChatRepository, ChannelInput } from "../ports/ChatRepository.js";
import type { Channel } from "../../domain/entities/Channel.js";
import { ChannelNameConflictError } from "../errors/ChannelNameConflictError.js";

export class CreateChannel {
  constructor(private chatRepository: ChatRepository) {}

  async execute(input: ChannelInput): Promise<Channel> {
    const existing = await this.chatRepository.findChannelByName(input.name);
    if (existing) {
      throw new ChannelNameConflictError();
    }
    return this.chatRepository.createChannel(input);
  }
}