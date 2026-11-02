/**
 * Formats a Swedish organisation number as NNNNNN-NNNN.
 * Returns null when the input does not contain exactly ten digits.
 */
export function formatOrgNumber(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (digits.length !== 10) {
    return null;
  }
  return `${digits.slice(0, 6)}-${digits.slice(6)}`;
}
