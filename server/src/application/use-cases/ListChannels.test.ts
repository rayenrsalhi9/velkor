import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ListChannels } from "./ListChannels.js";
import { makeChatRepository, channel } from "./chatTestSupport.js";

describe("ListChannels", () => {
  it("returns channels from the repository", async () => {
    const listChannels = new ListChannels(makeChatRepository().repository);
    assert.deepEqual(await listChannels.execute(), []);
  });

  it("passes through channels reported by the repository", async () => {
    const existing = channel("ch1");
    const { repository } = makeChatRepository({
      async listChannels() {
        return [existing];
      },
    });
    const listChannels = new ListChannels(repository);
    assert.deepEqual(await listChannels.execute(), [existing]);
  });
});