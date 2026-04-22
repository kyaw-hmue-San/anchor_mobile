export function getFriendlyFirebaseError(error: unknown, fallback: string) {
  if (error instanceof Error) {
    const raw = error.message || "";
    const message = raw.toLowerCase();

    if (message.includes("invalid pairing code")) {
      return "Invalid pairing code. Please check and try again.";
    }

    if (message.includes("pairing code expired")) {
      return "Pairing code expired. Ask your partner to generate a new one.";
    }

    if (message.includes("pairing code already used")) {
      return "This pairing code was already used. Ask for a fresh code.";
    }

    if (message.includes("session mismatch") || message.includes("not signed in") || message.includes("unauthenticated")) {
      return "Please sign in again and retry.";
    }

    if (message.includes("requires-recent-login") || message.includes("recent authentication")) {
      return "For security, please sign out, sign in again, then retry account deletion.";
    }

    if (message.includes("permission") || message.includes("permission-denied")) {
      return "You don't have permission for this action. Please sign in again and verify Firebase rules.";
    }

    if (message.includes("network") || message.includes("unavailable") || message.includes("timeout") || message.includes("request failed")) {
      return "Network issue. Check your connection and try again.";
    }

    if (message.includes("firebasestorage") || message.includes("storage") || message.includes("bucket") || message.includes("cors") || message.includes("xmlhttprequest")) {
      return "Storage is not available right now. Please try again later.";
    }
  }

  return fallback;
}

export function toFriendlyError(error: unknown, fallback: string) {
  return new Error(getFriendlyFirebaseError(error, fallback));
}
