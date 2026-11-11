export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 50;

const USERNAME_PATTERN = /^[a-z0-9][a-z0-9_-]{1,48}[a-z0-9]$/;

export const RESERVED_USERNAMES = new Set<string>([
  "admin",
  "administrator",
  "superadmin",
  "super-admin",
  "moderator",
  "system",
  "root",
  "support",
  "help",
  "security",
  "info",
  "contact",
  "about",
  "privacy",
  "terms",
  "api",
  "auth",
  "login",
  "register",
  "signup",
  "signin",
  "logout",
  "verify-email",
  "forgot-password",
  "reset-password",
  "profile",
  "settings",
  "dashboard",
  "notifications",
  "following",
  "followers",
  "follow-stats",
  "block",
  "avatar",
  "banner",
  "username",
  "username-availability",
  "users",
  "user",
  "team",
  "teams",
  "medinex",
  "medinex-official",
  "shasthosetu",
  "community",
  "projects",
  "updates",
  "events",
  "uploads",
  "null",
  "undefined",
  "me",
  "www",
  "mail",
  "noreply",
  "postmaster",
]);

export function sanitizeUsernameInput(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, USERNAME_MAX_LENGTH);
}

export function validateUsernameLocally(normalized: string): string | null {
  if (!normalized) {
    return "Username is required.";
  }
  if (normalized.length < USERNAME_MIN_LENGTH || normalized.length > USERNAME_MAX_LENGTH) {
    return `Username must be between ${USERNAME_MIN_LENGTH} and ${USERNAME_MAX_LENGTH} characters.`;
  }
  if (!USERNAME_PATTERN.test(normalized)) {
    return "Use letters, numbers, underscores, or hyphens, starting and ending with a letter or number.";
  }
  if (RESERVED_USERNAMES.has(normalized)) {
    return "This username is reserved for platform navigation.";
  }
  return null;
}
