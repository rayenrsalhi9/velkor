import type {
  ChatRepository,
  MessageInput,
} from "../ports/ChatRepository.js";
import type { Message } from "../../domain/entities/Message.js";
import { ChannelNotFoundError } from "../errors/ChannelNotFoundError.js";

export class SendMessage {
  constructor(private chatRepository: ChatRepository) {}

  async execute(input: MessageInput): Promise<Message> {
    const channel = await this.chatRepository.findChannelById(input.channelId);
    if (!channel) {
      throw new ChannelNotFoundError();
    }
    return this.chatRepository.createMessage(input);
  }
}