/**
 * Cloudflare Turnstile Server Verification Helper
 * Verifies Turnstile / hCaptcha challenge responses server-side.
 */

export interface TurnstileVerifyResult {
  success: boolean;
  error?: string;
}

export async function verifyTurnstileToken(
  token?: string | null,
  clientIp?: string
): Promise<TurnstileVerifyResult> {
  const secretKey = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;

  // If Turnstile secret key is not set, allow bypass with warning so dev/initial deployment does not break
  if (!secretKey) {
    if (process.env.NODE_ENV === "production") {
      console.warn("Turnstile check skipped: CLOUDFLARE_TURNSTILE_SECRET_KEY not set in environment.");
    }
    return { success: true };
  }

  if (!token) {
    return {
      success: false,
      error: "يرجى إكمال التحقق الأمني (Turnstile challenge required).",
    };
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token);
    if (clientIp) {
      formData.append("remoteip", clientIp);
    }

    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: formData,
      signal: AbortSignal.timeout(4000),
    });

    if (!response.ok) {
      return { success: false, error: "Failed to communicate with verification provider" };
    }

    const outcome = await response.json();
    if (!outcome.success) {
      return {
        success: false,
        error: "فشل التحقق الأمني. يرجى إعادة المحاولة.",
      };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Turnstile verification error:", err);
    // If external service fails, fail closed in production only if strictly configured
    return { success: false, error: "Security verification service unavailable" };
  }
}
