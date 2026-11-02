import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Exercise the real handlers without sending messages or using live credentials.
function loadModule(relativePath, context) {
  const filename = path.join(__dirname, "..", relativePath);
  const { outputText } = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: filename,
  });
  const exports = {};
  vm.runInNewContext(outputText, { exports, ...context }, { filename });
  return exports;
}

function setup({ env, result, providerError, providerStatus = 200, insertError } = {}) {
  const calls = { verification: [], writes: [], notifications: [], after: [] };
  const { verifyContactToken } = loadModule("src/lib/turnstile.ts", {
    process: { env: { TURNSTILE_SECRET_KEY: "test-secret", ...env } },
    console: { error() {} },
    AbortSignal,
    fetch: async (url, options) => {
      calls.verification.push({ url, options });
      if (providerError) throw providerError;
      return new Response(JSON.stringify(result ?? {
        success: true, action: "contact", hostname: "www.serb.work",
      }), { status: providerStatus });
    },
  });

  const { POST } = loadModule("src/app/api/contact/route.ts", {
    console: { error() {} },
    require: (name) => {
      if (name === "@/lib/turnstile") return { verifyContactToken };
      if (name === "next/server") return {
        NextResponse: Response,
        after: (callback) => calls.after.push(callback),
      };
      if (name === "@/lib/notify") return {
        sendNewMessageTelegram: async (message) => calls.notifications.push(message),
      };
      if (name === "@/lib/supabase") return {
        createServiceClient: () => ({
          from: (table) => {
            assert.equal(table, "messages");
            return { insert: async (message) => {
              calls.writes.push(message);
              return { error: insertError ?? null };
            } };
          },
        }),
      };
      throw new Error(`Unexpected import: ${name}`);
    },
  });

  return { calls, post: (body) => POST(new Request("https://www.serb.work/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  })) };
}

const message = {
  name: " Test Visitor ", email: "visitor@example.com", company: " Studio ",
  message: "Hello, I have a project in mind.", turnstileToken: "valid-token",
};

function assertNoSideEffects(calls) {
  assert.equal(calls.writes.length, 0);
  assert.equal(calls.after.length, 0);
  assert.equal(calls.notifications.length, 0);
}

test("verified contact token saves the message, then schedules a notification", async () => {
  const { post, calls } = setup();
  assert.equal((await post(message)).status, 200);
  assert.equal(calls.verification.length, 1);
  assert.equal(calls.writes.length, 1);
  assert.equal(calls.writes[0].name, "Test Visitor");
  assert.equal(calls.writes[0].company, "Studio");
  assert.equal("turnstileToken" in calls.writes[0], false);
  assert.equal(calls.notifications.length, 0);
  await calls.after[0]();
  assert.equal(calls.notifications.length, 1);
  assert.equal(calls.verification[0].url, "https://challenges.cloudflare.com/turnstile/v0/siteverify");
  assert.deepEqual(JSON.parse(calls.verification[0].options.body), {
    secret: "test-secret", response: "valid-token",
  });
  assert.equal(calls.verification[0].options.cache, "no-store");
});

for (const token of [undefined, null, "", " ", 42, {}, "x".repeat(2049)]) {
  test(`missing or malformed token is rejected (${typeof token}, length ${String(token).length})`, async () => {
    const { post, calls } = setup();
    assert.equal((await post({ ...message, turnstileToken: token })).status, 400);
    assert.equal(calls.verification.length, 0);
    assertNoSideEffects(calls);
  });
}

for (const result of [
  { success: false, "error-codes": ["invalid-input-response"] },
  { success: false, "error-codes": ["timeout-or-duplicate"] },
  { success: "true", action: "contact", hostname: "www.serb.work" },
  { success: true, action: "login", hostname: "www.serb.work" },
  { success: true, action: "contact", hostname: "attacker.example" },
  { success: true },
]) {
  test(`untrusted verification response is rejected: ${JSON.stringify(result)}`, async () => {
    const { post, calls } = setup({ result });
    assert.equal((await post(message)).status, 403);
    assertNoSideEffects(calls);
  });
}

test("missing secret disables submission without calling the provider", async () => {
  const { post, calls } = setup({ env: { TURNSTILE_SECRET_KEY: "" } });
  assert.equal((await post(message)).status, 503);
  assert.equal(calls.verification.length, 0);
  assertNoSideEffects(calls);
});

for (const options of [
  { providerError: new Error("Network failure") },
  { providerError: new DOMException("Timed out", "TimeoutError") },
  { providerStatus: 500 },
  { result: "invalid provider payload" },
]) {
  test(`provider failure fails closed: ${JSON.stringify(options)}`, async () => {
    const { post, calls } = setup(options);
    assert.equal((await post(message)).status, 503);
    assertNoSideEffects(calls);
  });
}

test("configured hostname allowlist supports a preview domain", async () => {
  const { post } = setup({
    env: { TURNSTILE_ALLOWED_HOSTNAMES: " www.serb.work, preview.example " },
    result: { success: true, action: "contact", hostname: "preview.example" },
  });
  assert.equal((await post(message)).status, 200);
});

test("database failure does not schedule a notification", async () => {
  const { post, calls } = setup({ insertError: { message: "Database unavailable" } });
  assert.equal((await post(message)).status, 500);
  assert.equal(calls.after.length, 0);
});

for (const body of ["{invalid", null, {}, { ...message, email: "invalid" }]) {
  test(`invalid form input has no side effects: ${JSON.stringify(body)}`, async () => {
    const { post, calls } = setup();
    assert.equal((await post(body)).status, 400);
    assert.equal(calls.verification.length, 0);
    assertNoSideEffects(calls);
  });
}
