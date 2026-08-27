import type {
  ChatRepository,
  ListMessagesParams,
} from "../ports/ChatRepository.js";
import type { Message } from "../../domain/entities/Message.js";
import { ChannelNotFoundError } from "../errors/ChannelNotFoundError.js";

export class ListMessages {
  constructor(private chatRepository: ChatRepository) {}

  async execute(params: ListMessagesParams): Promise<Message[]> {
    const channel = await this.chatRepository.findChannelById(params.channelId);
    if (!channel) {
      throw new ChannelNotFoundError();
    }
    return this.chatRepository.listMessages(params);
  }
}