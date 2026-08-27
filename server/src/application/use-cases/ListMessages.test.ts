import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ListMessages } from "./ListMessages.js";
import { ChannelNotFoundError } from "../errors/ChannelNotFoundError.js";
import { makeChatRepository, channel, message } from "./chatTestSupport.js";

describe("ListMessages", () => {
  it("returns messages when the channel exists", async () => {
    const existing = message("m1");
    const { repository } = makeChatRepository({
      async findChannelById() {
        return channel("ch1");
      },
      async listMessages() {
        return [existing];
      },
    });
    const listMessages = new ListMessages(repository);
    const result = await listMessages.execute({
      channelId: "ch1",
      limit: 50,
    });
    assert.deepEqual(result, [existing]);
  });

  it("throws when the channel is missing", async () => {
    const listMessages = new ListMessages(makeChatRepository().repository);
    await assert.rejects(
      listMessages.execute({ channelId: "missing", limit: 50 }),
      ChannelNotFoundError,
    );
  });

  it("passes the cursor to the repository", async () => {
    let captured: Record<string, unknown> | null = null;
    const { repository } = makeChatRepository({
      async findChannelById() {
        return channel("ch1");
      },
      async listMessages(params) {
        captured = params as unknown as Record<string, unknown>;
        return [];
      },
    });
    const listMessages = new ListMessages(repository);
    await listMessages.execute({ channelId: "ch1", before: "m9", limit: 50 });
    assert.deepEqual(captured, { channelId: "ch1", before: "m9", limit: 50 });
  });
});