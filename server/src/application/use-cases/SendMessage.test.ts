import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { SendMessage } from "./SendMessage.js";
import { ChannelNotFoundError } from "../errors/ChannelNotFoundError.js";
import { makeChatRepository, channel } from "./chatTestSupport.js";

describe("SendMessage", () => {
  it("persists the message when the channel exists", async () => {
    const { repository, calls } = makeChatRepository({
      async findChannelById() {
        return channel("ch1");
      },
    });
    const sendMessage = new SendMessage(repository);
    const sent = await sendMessage.execute({
      channelId: "ch1",
      authorId: "u1",
      body: "hello",
    });
    assert.equal(sent.body, "hello");
    assert.deepEqual(calls.createMessage[0], {
      channelId: "ch1",
      authorId: "u1",
      body: "hello",
    });
  });

  it("throws when the channel is missing", async () => {
    const sendMessage = new SendMessage(makeChatRepository().repository);
    await assert.rejects(
      sendMessage.execute({
        channelId: "missing",
        authorId: "u1",
        body: "hello",
      }),
      ChannelNotFoundError,
    );
  });
});