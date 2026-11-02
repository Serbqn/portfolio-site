type VerificationResult =
  | { ok: true }
  | { ok: false; status: 400 | 403 | 503; error: string };

/** Always verify before any database write or notification. Fail closed. */
export async function verifyContactToken(token: unknown): Promise<VerificationResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.error("Contact verification is not configured.");
    return {
      ok: false,
      status: 503,
      error: "The contact form is temporarily unavailable. Please email me directly.",
    };
  }

  if (typeof token !== "string" || !token.trim() || token.length > 2048) {
    return {
      ok: false,
      status: 400,
      error: "Please complete the security verification and try again.",
    };
  }

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret, response: token }),
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      },
    );
    if (!response.ok) throw new Error("Siteverify unavailable");

    const result: unknown = await response.json();
    if (!result || typeof result !== "object") {
      throw new Error("Invalid Siteverify response");
    }
    const { success, hostname, action } = result as {
      success?: unknown;
      hostname?: unknown;
      action?: unknown;
    };
    const allowedHostnames = (
      process.env.TURNSTILE_ALLOWED_HOSTNAMES ?? "serb.work,www.serb.work"
    )
      .split(",")
      .map((host) => host.trim().toLowerCase())
      .filter(Boolean);

    if (
      success !== true ||
      action !== "contact" ||
      typeof hostname !== "string" ||
      !allowedHostnames.includes(hostname.toLowerCase())
    ) {
      return {
        ok: false,
        status: 403,
        error: "Security verification failed or expired. Please verify again.",
      };
    }

    return { ok: true };
  } catch {
    // Do not log tokens, secrets, or the visitor's message.
    console.error("Contact verification service unavailable.");
    return {
      ok: false,
      status: 503,
      error: "Security verification is unavailable. Please try again or email me directly.",
    };
  }
}
