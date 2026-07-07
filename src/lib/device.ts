// Anonymous device identifier stored in localStorage.
// Used so returning visitors can view / reschedule their own bookings without
// signing up. The id is a random uuid — it is not a security token and the
// server never trusts it for anything sensitive (writes still go through
// server functions with quota + validation).

const KEY = "siba_device_id_v1";

function makeId(): string {
  try {
    const c = (globalThis as { crypto?: Crypto }).crypto;
    if (c?.randomUUID) return c.randomUUID();
    const buf = new Uint8Array(16);
    c?.getRandomValues?.(buf);
    return Array.from(buf)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return `d_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }
}

export function getDeviceId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = window.localStorage.getItem(KEY);
    if (!id || id.length < 10) {
      id = makeId();
      window.localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}

export function isValidDeviceId(id: unknown): id is string {
  return typeof id === "string" && /^[a-zA-Z0-9_-]{10,64}$/.test(id);
}
