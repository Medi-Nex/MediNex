"use client";

import { useEffect, useState } from "react";

export const OTP_RESEND_COOLDOWN_SECONDS = 120;

export function formatOtpCountdown(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function useOtpCooldown(
  storagePrefix: string,
  emailInput: string,
  initialEmail: string,
  justSent: boolean
) {
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [trigger, setTrigger] = useState(0);

  useEffect(() => {
    const emailKey = emailInput.trim().toLowerCase();
    if (!emailKey) return;

    const storageKey = `${storagePrefix}${emailKey}`;
    let untilMs = Number(window.sessionStorage.getItem(storageKey) || "0");

    if ((!untilMs || Number.isNaN(untilMs)) && justSent && emailKey === initialEmail.trim().toLowerCase()) {
      untilMs = Date.now() + OTP_RESEND_COOLDOWN_SECONDS * 1000;
      window.sessionStorage.setItem(storageKey, String(untilMs));
    }

    const syncRemaining = () => {
      const storedUntil = Number(window.sessionStorage.getItem(storageKey) || String(untilMs) || "0");
      const remaining = storedUntil > 0 ? Math.max(0, Math.ceil((storedUntil - Date.now()) / 1000)) : 0;
      setCooldownSeconds(remaining);
      if (remaining <= 0) {
        window.sessionStorage.removeItem(storageKey);
      }
    };

    const immediateTimer = window.setTimeout(syncRemaining, 0);
    const interval = window.setInterval(syncRemaining, 1000);
    return () => {
      window.clearTimeout(immediateTimer);
      window.clearInterval(interval);
    };
  }, [storagePrefix, emailInput, initialEmail, justSent, trigger]);

  const startCooldown = (targetEmail: string, seconds: number = OTP_RESEND_COOLDOWN_SECONDS) => {
    const emailKey = targetEmail.trim().toLowerCase();
    if (!emailKey) return;
    const storageKey = `${storagePrefix}${emailKey}`;
    window.sessionStorage.setItem(storageKey, String(Date.now() + seconds * 1000));
    setCooldownSeconds(seconds);
    setTrigger((prev) => prev + 1);
  };

  return { cooldownSeconds, startCooldown };
}
