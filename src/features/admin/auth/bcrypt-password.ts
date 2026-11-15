export const BCRYPT_PASSWORD_MAX_BYTES = 72;
export const BCRYPT_PASSWORD_TOO_LONG = `Password must not exceed ${BCRYPT_PASSWORD_MAX_BYTES} UTF-8 bytes.`;

export function isWithinBcryptPasswordLimit(password: string) {
  return new TextEncoder().encode(password).byteLength <= BCRYPT_PASSWORD_MAX_BYTES;
}
