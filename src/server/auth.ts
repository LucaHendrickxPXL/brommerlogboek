import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { ThemePreference, isThemePreference } from "@/lib/theme-preference";
import { AppError } from "@/server/app-errors";
import { withDbClient, withDbTransaction } from "@/server/db";

const scrypt = promisify(scryptCallback);

const SESSION_COOKIE_NAME = "brommerlogboek_session";
const THEME_PREFERENCE_COOKIE_NAME = "brommerlogboek_theme";
const SESSION_DURATION_DAYS = 30;

interface UserRow {
  id: string;
  email: string;
  display_name: string;
  password_hash: string | null;
  theme_preference: ThemePreference;
}

interface PgErrorLike {
  code?: string;
}

export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
  themePreference: ThemePreference;
}

function mapSessionUser(row: Pick<UserRow, "id" | "email" | "display_name" | "theme_preference">): SessionUser {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    themePreference: row.theme_preference,
  };
}

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

async function verifyPassword(password: string, storedHash: string | null) {
  if (!storedHash) {
    return false;
  }

  const [algorithm, salt, key] = storedHash.split(":");

  if (algorithm !== "scrypt" || !salt || !key) {
    return false;
  }

  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  const expectedKey = Buffer.from(key, "hex");

  if (derivedKey.length !== expectedKey.length) {
    return false;
  }

  return timingSafeEqual(derivedKey, expectedKey);
}

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function isUniqueViolation(error: unknown): error is PgErrorLike {
  return typeof error === "object" && error !== null && "code" in error && (error as PgErrorLike).code === "23505";
}

function parseBooleanEnv(value: string | undefined) {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();

  if (!normalized) {
    return undefined;
  }

  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return undefined;
}

async function shouldUseSecureCookies() {
  const forced = parseBooleanEnv(process.env.AUTH_COOKIE_SECURE);

  if (typeof forced === "boolean") {
    return forced;
  }

  const headerStore = await headers();
  const forwardedProto = headerStore
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim()
    .toLowerCase();

  if (forwardedProto === "https") {
    return true;
  }

  if (forwardedProto === "http") {
    return false;
  }

  const origin = headerStore.get("origin");

  if (origin) {
    try {
      return new URL(origin).protocol === "https:";
    } catch {
      // Ignore malformed origin headers and fall back to environment defaults.
    }
  }

  return process.env.NODE_ENV === "production";
}

async function setSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies();
  const secure = await shouldUseSecureCookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    expires: expiresAt,
  });
}

export async function setThemePreferenceCookie(themePreference: ThemePreference, expiresAt: Date) {
  const cookieStore = await cookies();
  const secure = await shouldUseSecureCookies();

  cookieStore.set(THEME_PREFERENCE_COOKIE_NAME, themePreference, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  const secure = await shouldUseSecureCookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    expires: new Date(0),
  });
}

export async function clearThemePreferenceCookie() {
  const cookieStore = await cookies();
  const secure = await shouldUseSecureCookies();
  cookieStore.set(THEME_PREFERENCE_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    expires: new Date(0),
  });
}

export async function getThemePreferenceFromCookie() {
  const cookieStore = await cookies();

  if (!cookieStore.get(SESSION_COOKIE_NAME)?.value) {
    return "auto" as ThemePreference;
  }

  const value = cookieStore.get(THEME_PREFERENCE_COOKIE_NAME)?.value;

  if (isThemePreference(value)) {
    return value;
  }

  return "auto" as ThemePreference;
}

export async function registerUser(input: {
  email: string;
  displayName: string;
  password: string;
}) {
  const passwordHash = await hashPassword(input.password);

  return withDbTransaction(async (client) => {
    try {
      const insertResult = await client.query<UserRow>(
        `
          insert into users (email, display_name, password_hash)
          values ($1, $2, $3)
          returning id, email, display_name, password_hash, theme_preference
        `,
        [input.email.trim().toLowerCase(), input.displayName, passwordHash],
      );

      return mapSessionUser(insertResult.rows[0]);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new AppError({
          code: "AUTH_EMAIL_ALREADY_IN_USE",
          message: "Er bestaat al een account met dit e-mailadres.",
          fieldErrors: {
            email: "Er bestaat al een account met dit e-mailadres.",
          },
          cause: error,
        });
      }

      throw error;
    }
  });
}

export async function authenticateUser(email: string, password: string) {
  const user = await withDbClient(async (client) => {
    const result = await client.query<UserRow>(
      `
        select id, email, display_name, password_hash, theme_preference
        from users
        where lower(email) = $1
        limit 1
      `,
      [email.trim().toLowerCase()],
    );

    return result.rows[0] ?? null;
  });

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    throw new AppError({
      code: "AUTH_INVALID_CREDENTIALS",
      message: "E-mailadres of wachtwoord klopt niet.",
      fieldErrors: {
        email: "Controleer je login.",
        password: "Controleer je login.",
      },
    });
  }

  return mapSessionUser(user);
}

export async function createSession(userId: string, themePreference: ThemePreference) {
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashSessionToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);

  await withDbClient(async (client) => {
    await client.query(
      `
        insert into sessions (user_id, session_token_hash, expires_at, last_seen_at)
        values ($1, $2, $3, now())
      `,
      [userId, tokenHash, expiresAt.toISOString()],
    );
  });

  await setSessionCookie(rawToken, expiresAt);
  await setThemePreferenceCookie(themePreference, expiresAt);
}

export async function deleteCurrentSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    await clearSessionCookie();
    await clearThemePreferenceCookie();
    return;
  }

  await withDbClient(async (client) => {
    await client.query("delete from sessions where session_token_hash = $1", [hashSessionToken(sessionToken)]);
  });

  await clearSessionCookie();
  await clearThemePreferenceCookie();
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return null;
  }

  const result = await withDbClient(async (client) => {
    return client.query<Pick<UserRow, "id" | "email" | "display_name" | "theme_preference">>(
      `
        select u.id, u.email, u.display_name, u.theme_preference
        from sessions s
        inner join users u on u.id = s.user_id
        where s.session_token_hash = $1
          and s.expires_at > now()
        limit 1
      `,
      [hashSessionToken(sessionToken)],
    );
  });

  const row = result.rows[0];

  if (!row) {
    return null;
  }

  return mapSessionUser(row);
}

export async function updateUserThemePreference(userId: string, themePreference: ThemePreference) {
  await withDbClient(async (client) => {
    await client.query(
      `
        update users
        set theme_preference = $2
        where id = $1
      `,
      [userId, themePreference],
    );
  });
}

export async function requireAppUser() {
  const currentUser = await getCurrentUser();

  if (currentUser) {
    return currentUser;
  }

  redirect("/login");
}

export async function redirectIfAuthenticated() {
  const currentUser = await getCurrentUser();

  if (currentUser) {
    redirect("/");
  }
}
