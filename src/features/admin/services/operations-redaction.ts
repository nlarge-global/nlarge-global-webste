export function sanitizeOperationsText(value: string) {
  return value
    .replace(/mongodb(?:\+srv)?:\/\/\S+/gi, "[redacted database URI]")
    .replace(/\b(password|token|secret|authorization|cookie)\s*[:=]\s*[^,\s;]+/gi, "$1=[redacted]")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[redacted email]")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, " ")
    .slice(0, 3000);
}
