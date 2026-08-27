import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { SoftDeleteMessage } from "./SoftDeleteMessage.js";
import { MessageNotFoundError } from "../errors/MessageNotFoundError.js";
import { NotMessageAuthorError } from "../errors/NotMessageAuthorError.js";
import { makeChatRepository, message } from "./chatTestSupport.js";

const authored = message("m1", { authorId: "u1" });

describe("SoftDeleteMessage", () => {
  it("deletes when the actor is the author", async () => {
    const { repository, calls } = makeChatRepository({
      async findMessageById(id) {
        return id === authored.id ? authored : null;
      },
    });
    const softDeleteMessage = new SoftDeleteMessage(repository);
    await softDeleteMessage.execute(authored.id, "u1");
    assert.deepEqual(calls.deleteMessage, [authored.id]);
  });

  it("rejects a non-author actor", async () => {
    const softDeleteMessage = new SoftDeleteMessage(
      makeChatRepository({
        async findMessageById(id) {
          return id === authored.id ? authored : null;
        },
      }).repository,
    );
    await assert.rejects(
      softDeleteMessage.execute(authored.id, "u2"),
      NotMessageAuthorError,
    );
  });

  it("throws when the message is missing", async () => {
    const softDeleteMessage = new SoftDeleteMessage(
      makeChatRepository().repository,
    );
    await assert.rejects(
      softDeleteMessage.execute("missing", "u1"),
      MessageNotFoundError,
    );
  });
});