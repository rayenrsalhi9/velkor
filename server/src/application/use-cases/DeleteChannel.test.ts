import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { DeleteChannel } from "./DeleteChannel.js";
import { ChannelNotFoundError } from "../errors/ChannelNotFoundError.js";
import { NotChannelOwnerError } from "../errors/NotChannelOwnerError.js";
import { makeChatRepository, channel } from "./chatTestSupport.js";

const owned = channel("ch1", { createdById: "u1" });

describe("DeleteChannel", () => {
  it("soft-deletes when the actor is the creator", async () => {
    const { repository, calls } = makeChatRepository({
      async findChannelById(id) {
        return id === owned.id ? owned : null;
      },
    });
    const deleteChannel = new DeleteChannel(repository);
    await deleteChannel.execute(owned.id, { userId: "u1", isAdmin: false });
    assert.deepEqual(calls.deleteChannel, [owned.id]);
  });

  it("soft-deletes when the actor is an admin", async () => {
    const { repository, calls } = makeChatRepository({
      async findChannelById(id) {
        return id === owned.id ? owned : null;
      },
    });
    const deleteChannel = new DeleteChannel(repository);
    await deleteChannel.execute(owned.id, { userId: "u2", isAdmin: true });
    assert.deepEqual(calls.deleteChannel, [owned.id]);
  });

  it("rejects a non-creator non-admin actor", async () => {
    const deleteChannel = new DeleteChannel(
      makeChatRepository({
        async findChannelById(id) {
          return id === owned.id ? owned : null;
        },
      }).repository,
    );
    await assert.rejects(
      deleteChannel.execute(owned.id, { userId: "u2", isAdmin: false }),
      NotChannelOwnerError,
    );
  });

  it("throws when the channel is missing", async () => {
    const deleteChannel = new DeleteChannel(makeChatRepository().repository);
    await assert.rejects(
      deleteChannel.execute("missing", { userId: "u1", isAdmin: false }),
      ChannelNotFoundError,
    );
  });
});