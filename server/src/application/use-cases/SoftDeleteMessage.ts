import type { ChatRepository } from "../ports/ChatRepository.js";
import { MessageNotFoundError } from "../errors/MessageNotFoundError.js";
import { NotMessageAuthorError } from "../errors/NotMessageAuthorError.js";

export class SoftDeleteMessage {
  constructor(private chatRepository: ChatRepository) {}

  async execute(messageId: string, userId: string): Promise<void> {
    const message = await this.chatRepository.findMessageById(messageId);
    if (!message) {
      throw new MessageNotFoundError();
    }
    if (message.authorId !== userId) {
      throw new NotMessageAuthorError();
    }
    await this.chatRepository.deleteMessage(messageId);
  }
}