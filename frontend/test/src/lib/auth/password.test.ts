import { assertEquals, assertRejects } from "jsr:@std/assert";
import { ONLINE_ONLY_OFFLINE_MESSAGE } from "../../../../src/lib/offline/onlineOnly.ts";

Deno.env.set("VITE_SUPABASE_URL", "https://example.supabase.co");
Deno.env.set("VITE_SUPABASE_ANON_KEY", "test-anon-key");

const {
  changeTeacherPassword,
  getPasswordResetRedirectUrl,
  normalizeAuthEmail,
  requestTeacherPasswordReset,
  validateNewPassword,
  validateRecoveryOtp,
  verifyTeacherPasswordResetOtp,
} = await import("../../../../src/lib/auth/password.ts");
type PasswordAuthApi = {
  resetPasswordForEmail: (
    email: string,
    options?: { redirectTo?: string },
  ) => Promise<{ error: Error | null }>;
  verifyOtp: (credentials: {
    email: string;
    token: string;
    type: "recovery";
  }) => Promise<{ error: Error | null }>;
  updateUser: (attributes: {
    password: string;
    current_password?: string;
  }) => Promise<{ error: Error | null }>;
};

const makeAuth = (calls: Array<unknown>): PasswordAuthApi => ({
  resetPasswordForEmail: async (email, options) => {
    calls.push(["reset", email, options]);
    return { error: null };
  },
  verifyOtp: async (credentials) => {
    calls.push(["verify", credentials]);
    return { error: null };
  },
  updateUser: async (attributes) => {
    calls.push(["update", attributes]);
    return { error: null };
  },
});

Deno.test("normalizes email for Auth requests", () => {
  assertEquals(normalizeAuthEmail("  Teacher@Example.COM "), "teacher@example.com");
});

Deno.test("validates a six-digit recovery OTP", () => {
  assertEquals(validateRecoveryOtp("123456"), null);
  assertEquals(validateRecoveryOtp("12345"), "Enter the 6-digit code.");
  assertEquals(validateRecoveryOtp("12a456"), "Enter the 6-digit code.");
});

Deno.test("requires a matching non-empty new password", () => {
  assertEquals(validateNewPassword("new-secret", "new-secret"), null);
  assertEquals(validateNewPassword("", ""), "Enter a new password.");
  assertEquals(validateNewPassword("new-secret", "different"), "Passwords do not match.");
});

Deno.test("requests recovery with a normalized email and reset route", async () => {
  const calls: Array<unknown> = [];
  const previousWindow = (globalThis as { window?: unknown }).window;
  (globalThis as { window?: unknown }).window = { location: { origin: "https://app.example" } };
  try {
    await requestTeacherPasswordReset("  TEACHER@example.com ", makeAuth(calls));
  } finally {
    (globalThis as { window?: unknown }).window = previousWindow;
  }
  assertEquals(calls, [[
    "reset",
    "teacher@example.com",
    { redirectTo: "https://app.example/reset-password" },
  ]]);
  assertEquals(
    getPasswordResetRedirectUrl("https://app.example/"),
    "https://app.example/reset-password",
  );
});

Deno.test("verifies a recovery OTP with the recovery type", async () => {
  const calls: Array<unknown> = [];
  await verifyTeacherPasswordResetOtp("Teacher@Example.com", "123456", makeAuth(calls));
  assertEquals(calls, [["verify", {
    email: "teacher@example.com",
    token: "123456",
    type: "recovery",
  }]]);
});

Deno.test("submits current and new passwords for a signed-in change", async () => {
  const calls: Array<unknown> = [];
  await changeTeacherPassword("current-secret", "new-secret", "new-secret", makeAuth(calls));
  assertEquals(calls, [["update", {
    password: "new-secret",
    current_password: "current-secret",
  }]]);
});

Deno.test("does not call Auth for an invalid OTP", async () => {
  const calls: Array<unknown> = [];
  await assertRejects(
    () => verifyTeacherPasswordResetOtp("teacher@example.com", "bad", makeAuth(calls)),
    Error,
    "Enter the 6-digit code.",
  );
  assertEquals(calls, []);
});

Deno.test("does not call Auth when changing a password offline", async () => {
  const calls: Array<unknown> = [];
  const previousNavigator = globalThis.navigator;
  Object.defineProperty(globalThis, "navigator", { value: { onLine: false }, configurable: true });
  try {
    await assertRejects(
      () => changeTeacherPassword("current-secret", "new-secret", "new-secret", makeAuth(calls)),
      Error,
      ONLINE_ONLY_OFFLINE_MESSAGE,
    );
  } finally {
    Object.defineProperty(globalThis, "navigator", { value: previousNavigator, configurable: true });
  }
  assertEquals(calls, []);
});
