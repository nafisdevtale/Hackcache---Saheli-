// @vitest-environment node
import { it, expect } from "vitest";
import { deriveKey, encryptJSON, decryptJSON, randomSaltB64 } from "@/lib/encryption.js";
it("AES-GCM round trip, unique IVs, wrong PIN fails", async () => {
  const salt = randomSaltB64();
  const k = await deriveKey("1234", salt, 1000);
  const a = await encryptJSON(k, { note: "secret cramps" });
  const b = await encryptJSON(k, { note: "secret cramps" });
  expect(a.iv).not.toBe(b.iv);
  expect(JSON.stringify(a)).not.toContain("secret");
  expect(await decryptJSON(k, a)).toEqual({ note: "secret cramps" });
  await expect(decryptJSON(await deriveKey("9999", salt, 1000), a)).rejects.toBeTruthy();
});
