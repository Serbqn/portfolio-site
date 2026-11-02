"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

type Turnstile = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      action: string;
      theme: "dark";
      size: "flexible" | "compact";
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
      "timeout-callback": () => void;
      "response-field": false;
    },
  ) => string;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

export function ContactVerification({
  siteKey,
  onTokenChange,
}: {
  siteKey: string;
  onTokenChange: (token: string | null) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [size, setSize] = useState<"compact" | "flexible" | null>(null);

  useEffect(() => {
    if (!container.current) return;
    const observer = new ResizeObserver(([entry]) => {
      setSize(entry.contentRect.width < 300 ? "compact" : "flexible");
    });
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (ready) return;
    const timer = setTimeout(() => {
      setError("Verification could not load. Check your connection or browser settings and reload this page.");
    }, 15000);
    return () => clearTimeout(timer);
  }, [ready]);

  useEffect(() => {
    const turnstile = window.turnstile;
    if (!ready || !size || !container.current || !turnstile) return;
    let active = true;
    onTokenChange(null);
    setVerified(false);

    const fail = () => {
      if (!active) return;
      onTokenChange(null);
      setVerified(false);
      setError("Verification could not complete. Please try again.");
    };

    const widgetId = turnstile.render(container.current, {
      sitekey: siteKey,
      action: "contact",
      theme: "dark",
      // Compact mode fits when the form is narrower than Turnstile's 300px minimum.
      size,
      "response-field": false,
      callback: (token) => {
        if (!active) return;
        onTokenChange(token);
        setVerified(true);
        setError(null);
      },
      "expired-callback": () => {
        if (!active) return;
        onTokenChange(null);
        setVerified(false);
      },
      "error-callback": fail,
      "timeout-callback": fail,
    });

    return () => {
      active = false;
      turnstile.remove(widgetId);
    };
  }, [ready, siteKey, onTokenChange, attempt, size]);

  return (
    <div className="mt-6">
      <Script
        id="contact-turnstile"
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={() => setReady(true)}
        onError={() => {
          onTokenChange(null);
          setError("Verification could not load. Check your connection or browser settings and reload this page.");
        }}
      />
      <div ref={container} className={size === "compact" ? "min-h-[140px]" : "min-h-[65px]"} />
      <p role="status" className="mt-2 text-sm text-surface-200">
        {error ?? (verified ? "Security verification complete." : "Please wait for the security verification before sending.")}
      </p>
      {error && ready ? (
        <button
          type="button"
          className="mt-2 text-sm text-accent-400 underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-500"
          onClick={() => {
            onTokenChange(null);
            setVerified(false);
            setError(null);
            setAttempt((value) => value + 1);
          }}
        >
          Retry verification
        </button>
      ) : null}
    </div>
  );
}
