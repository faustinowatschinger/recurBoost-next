interface EmailTemplateInput {
  companyName: string;
  companyLogo?: string | null;
  senderName: string;
  portalUrl: string;
  preheader?: string | null;
  incentiveText?: string | null;
  openPixelUrl?: string | null;
}

interface EmailTemplateOutput {
  companyName: string;
  companyLogo?: string;
  senderName: string;
  portalUrl: string;
  preheader?: string;
  incentiveText?: string;
  openPixelUrl?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitizeText(value: string | null | undefined, maxLength: number): string {
  const normalized = (value ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maxLength);
  return escapeHtml(normalized);
}

function sanitizeHttpUrl(value: string | null | undefined): string {
  if (!value) return "#";

  try {
    const parsed = new URL(value);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") {
      return escapeHtml(parsed.toString());
    }
  } catch {
    // invalid
  }

  return "#";
}

function sanitizeLogoUrl(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  const isSafeDataUrl =
    /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/i.test(trimmed);
  if (isSafeDataUrl) {
    return escapeHtml(trimmed);
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "https:") {
      return escapeHtml(parsed.toString());
    }
  } catch {
    // invalid
  }

  return undefined;
}

export function sanitizeEmailTemplateInput(
  input: EmailTemplateInput
): EmailTemplateOutput {
  const companyName = sanitizeText(input.companyName, 120) || "Your provider";

  return {
    companyName,
    companyLogo: sanitizeLogoUrl(input.companyLogo),
    senderName: sanitizeText(input.senderName, 120) || "Support",
    portalUrl: sanitizeHttpUrl(input.portalUrl),
    preheader: sanitizeText(input.preheader, 180),
    incentiveText: sanitizeText(input.incentiveText, 280),
    openPixelUrl: sanitizeHttpUrl(input.openPixelUrl),
  };
}

