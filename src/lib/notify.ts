/**
 * New-contact-message notification via Telegram bot.
 *
 * Sends a ping to your private chat using the official Bot API — plain fetch,
 * no SDK. Setup (one-time):
 *   1. Telegram → @BotFather → /newbot → copy the HTTP API token.
 *   2. Send /start to your new bot (opens the chat).
 *   3. Open https://api.telegram.org/bot<TOKEN>/getUpdates → read chat.id.
 *
 * Env vars:
 * - TELEGRAM_BOT_TOKEN : token from BotFather
 * - TELEGRAM_CHAT_ID   : your chat id (or a group id like -100…)
 *
 * Not configured → logs a warning and skips, so the contact form keeps working.
 */

const TELEGRAM_ENDPOINT = "https://api.telegram.org";

/** Escape user-derived text for Telegram's parse_mode=HTML. */
function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export interface NewMessagePayload {
  name: string;
  email: string;
  company: string | null;
  message: string;
}

export async function sendNewMessageTelegram(
  payload: NewMessagePayload,
): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.warn(
      "[notify] skipped: TELEGRAM_BOT_TOKEN and/or TELEGRAM_CHAT_ID not set.",
    );
    return;
  }

  // Telegram hard-caps messages at ~4096 chars; the form allows 10k, so keep
  // the ping short and point at the dashboard for the full text.
  const MAX_MESSAGE = 3500;
  const truncated =
    payload.message.length > MAX_MESSAGE
      ? `${payload.message.slice(0, MAX_MESSAGE)}…\n\n(full message in Supabase dashboard)`
      : payload.message;

  const text = [
    "<b>New message — portfolio contact form</b>",
    "",
    `<b>Name:</b> ${escapeHtml(payload.name)}`,
    `<b>Email:</b> ${escapeHtml(payload.email)}`,
    `<b>Company:</b> ${escapeHtml(payload.company ?? "—")}`,
    "",
    escapeHtml(truncated),
    "",
    `<a href="mailto:${escapeHtml(payload.email)}">↩ Reply to ${escapeHtml(payload.name)}</a>`,
  ].join("\n");

  const res = await fetch(`${TELEGRAM_ENDPOINT}/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      `[notify] Telegram error ${res.status}: ${detail.slice(0, 300)}`,
    );
  }
}
