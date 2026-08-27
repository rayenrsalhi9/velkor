import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CreateChannel } from "./CreateChannel.js";
import { ChannelNameConflictError } from "../errors/ChannelNameConflictError.js";
import { makeChatRepository, channel } from "./chatTestSupport.js";

function makeUseCase(overrides?: { existingName?: string | null }) {
  const { repository, calls } = makeChatRepository({
    async findChannelByName(name) {
      return overrides?.existingName === name ? channel("ch1", { name }) : null;
    },
  });
  return { createChannel: new CreateChannel(repository), calls };
}

describe("CreateChannel", () => {
  it("creates a channel with name, description, and creator", async () => {
    const h = makeUseCase();
    const created = await h.createChannel.execute({
      name: "Sales",
      description: "Sales talk",
      createdById: "u1",
    });
    assert.equal(created.name, "Sales");
    assert.deepEqual(h.calls.createChannel[0], {
      name: "Sales",
      description: "Sales talk",
      createdById: "u1",
    });
  });

  it("rejects a duplicate channel name", async () => {
    const h = makeUseCase({ existingName: "Sales" });
    await assert.rejects(
      h.createChannel.execute({
        name: "Sales",
        description: null,
        createdById: "u1",
      }),
      ChannelNameConflictError,
    );
  });
});