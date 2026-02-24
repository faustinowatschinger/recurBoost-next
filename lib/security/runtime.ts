export const isProduction = process.env.NODE_ENV === "production";

// Mock mode is only allowed outside production to avoid accidental data exposure.
export const isMockModeEnabled =
  process.env.MOCK_DATA === "true" && !isProduction;

export function canUseTestOverrideEmail(): boolean {
  return (
    !isProduction &&
    process.env.ALLOW_TEST_OVERRIDE_EMAIL === "true" &&
    typeof process.env.TEST_OVERRIDE_EMAIL === "string" &&
    process.env.TEST_OVERRIDE_EMAIL.length > 0
  );
}

