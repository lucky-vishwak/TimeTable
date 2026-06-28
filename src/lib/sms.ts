// SMS delivery via an Android SMS Gateway app running on the user's phone.
//
// The phone runs an app (e.g. capcom6/android-sms-gateway, or "SMS Gateway")
// that exposes an HTTP endpoint. We POST the message; the phone sends the SMS
// from the real SIM. This keeps the "from MY number" requirement satisfiable.
//
// Because gateway apps differ in payload shape, this builds a best-effort
// generic JSON body and supports basic-auth / api-key headers via env.

export interface SmsResult {
  ok: boolean;
  sent: boolean;
  detail: string;
}

export async function sendSms(
  message: string,
  toOverride?: string
): Promise<SmsResult> {
  const url = process.env.SMS_GATEWAY_URL;
  const to = toOverride || process.env.SMS_TO || "";
  const from = process.env.SMS_FROM || "";
  const enabled = String(process.env.SMS_ENABLED).toLowerCase() === "true";

  if (!enabled) {
    return {
      ok: true,
      sent: false,
      detail: `[DRY-RUN] would SMS ${from} -> ${to}: ${message}`,
    };
  }
  if (!url) {
    return { ok: false, sent: false, detail: "SMS_GATEWAY_URL not configured" };
  }
  if (!to) {
    return { ok: false, sent: false, detail: "SMS_TO not configured" };
  }

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const user = process.env.SMS_GATEWAY_USERNAME;
  const pass = process.env.SMS_GATEWAY_PASSWORD;
  const apiKey = process.env.SMS_GATEWAY_API_KEY;
  if (user && pass) {
    headers.Authorization =
      "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");
  }
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

  // Generic body covering common gateway schemas.
  const body = JSON.stringify({
    message,
    text: message,
    textMessage: { text: message },
    phoneNumbers: [to],
    to,
    from,
  });

  try {
    const res = await fetch(url, { method: "POST", headers, body });
    const detail = await res.text();
    return {
      ok: res.ok,
      sent: res.ok,
      detail: `HTTP ${res.status} ${detail.slice(0, 200)}`,
    };
  } catch (err) {
    return {
      ok: false,
      sent: false,
      detail: `request failed: ${(err as Error).message}`,
    };
  }
}
