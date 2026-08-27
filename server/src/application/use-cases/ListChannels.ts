import type { ChatRepository } from "../ports/ChatRepository.js";
import type { Channel } from "../../domain/entities/Channel.js";

export class ListChannels {
  constructor(private chatRepository: ChatRepository) {}

  async execute(): Promise<Channel[]> {
    return this.chatRepository.listChannels();
  }
}