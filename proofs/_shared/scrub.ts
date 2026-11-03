/**
 * Finds personal data in proof output before it is committed.
 * Fixtures may hold public company data, never data about people.
 */

export type FindingKind = "email" | "personnummer" | "phone" | "name";

export interface Finding {
  kind: FindingKind;
  line: number;
  /** Masked, so the scanner never prints the personal data it found. */
  masked: string;
  value: string;
}

export interface AllowEntry {
  value: string;
  reason: string;
}

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

// Reserved for documentation and tests (RFC 2606, RFC 6761).
const SAFE_EMAIL_DOMAINS = /(^|\.)(example\.(com|org|net)|invalid|test|localhost)$/i;

// Addresses to a function, not a person, are not personal data.
const ROLE_LOCAL_PARTS = new Set([
  "info",
  "kontakt",
  "contact",
  "support",
  "noreply",
  "no-reply",
  "press",
  "sales",
  "salj",
  "hello",
  "hej",
  "office",
  "kontoret",
  "ekonomi",
  "faktura",
  "invoice",
  "order",
  "kundtjanst",
  "registrator",
  "admin",
  "webmaster",
  "security",
  "privacy",
  "dpo",
]);

const PERSONNUMMER = /(?<![\d])((?:19|20)?\d{2})(\d{2})(\d{2})[-+]?(\d{4})(?![\d])/g;

const PHONE = /(?<![\w])(?:\+46|0046|0)[\s-]?\d{1,3}(?:[\s-]?\d{2,4}){2,4}(?![\d])/g;

// Common Swedish first names. A first name followed by a capitalised word is treated as a person.
const FIRST_NAMES = [
  "Anna",
  "Eva",
  "Maria",
  "Karin",
  "Sara",
  "Christina",
  "Lena",
  "Emma",
  "Kerstin",
  "Marie",
  "Malin",
  "Ingrid",
  "Linda",
  "Jenny",
  "Sofia",
  "Elin",
  "Hanna",
  "Annika",
  "Johanna",
  "Ida",
  "Susanne",
  "Elisabeth",
  "Camilla",
  "Helena",
  "Ulla",
  "Monica",
  "Birgitta",
  "Julia",
  "Louise",
  "Amanda",
  "Lars",
  "Mikael",
  "Anders",
  "Johan",
  "Erik",
  "Per",
  "Karl",
  "Peter",
  "Thomas",
  "Jan",
  "Daniel",
  "Fredrik",
  "Hans",
  "Bengt",
  "Andreas",
  "Stefan",
  "Mats",
  "Magnus",
  "Mattias",
  "Jonas",
  "Niklas",
  "Bo",
  "Alexander",
  "Marcus",
  "Martin",
  "Henrik",
  "Oskar",
  "Gustav",
  "Axel",
  "Robert",
];
const NAME = new RegExp(
  `(?<![\\p{L}])(?:${FIRST_NAMES.join("|")})\\s+[A-ZÅÄÖ][a-zåäöéü]+(?:-[A-ZÅÄÖ][a-zåäöéü]+)?`,
  "gu",
);

function mask(value: string): string {
  return `${value.slice(0, 2)}…(${value.length} tecken)`;
}

/** Luhn checksum over the ten digits YYMMDDNNNN, as Skatteverket defines it. */
function luhnValid(tenDigits: string): boolean {
  let sum = 0;
  for (let i = 0; i < tenDigits.length; i += 1) {
    let digit = Number(tenDigits[i]) * (i % 2 === 0 ? 2 : 1);
    if (digit > 9) {
      digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

function isPersonnummer(match: RegExpExecArray): boolean {
  const [, year = "", month = "", day = "", serial = ""] = match;
  const m = Number(month);
  const d = Number(day);
  // Day 61–91 is a samordningsnummer. Organisation numbers have month >= 20 and fail here.
  const validDay = (d >= 1 && d <= 31) || (d >= 61 && d <= 91);
  if (m < 1 || m > 12 || !validDay) {
    return false;
  }
  return luhnValid(`${year.slice(-2)}${month}${day}${serial}`);
}

function isPersonalEmail(address: string): boolean {
  const [local = "", domain = ""] = address.toLowerCase().split("@");
  return !SAFE_EMAIL_DOMAINS.test(domain) && !ROLE_LOCAL_PARTS.has(local);
}

function isPhone(candidate: string): boolean {
  const digits = candidate.replace(/\D/g, "").replace(/^(0046|46)/, "0");
  return digits.length >= 8 && digits.length <= 11;
}

export function scanText(text: string, allow: readonly AllowEntry[] = []): Finding[] {
  const allowed = new Set(allow.map((entry) => entry.value));
  const findings: Finding[] = [];

  text.split(/\r?\n/).forEach((line, index) => {
    const add = (kind: FindingKind, value: string): void => {
      if (!allowed.has(value)) {
        findings.push({ kind, line: index + 1, masked: mask(value), value });
      }
    };

    for (const match of line.matchAll(EMAIL)) {
      if (isPersonalEmail(match[0])) {
        add("email", match[0]);
      }
    }
    for (const match of line.matchAll(PERSONNUMMER)) {
      if (isPersonnummer(match)) {
        add("personnummer", match[0]);
      }
    }
    for (const match of line.matchAll(PHONE)) {
      if (isPhone(match[0])) {
        add("phone", match[0].trim());
      }
    }
    for (const match of line.matchAll(NAME)) {
      add("name", match[0]);
    }
  });

  return findings;
}

/** Proof output that may hold data from real services. */
export function isScannedPath(path: string): boolean {
  const normalized = path.replaceAll("\\", "/");
  return (
    /^proofs\/[^/]+\/fixtures\/.+\.json$/.test(normalized) ||
    /^proofs\/[^/]+\/(result\.json|VERIFIED\.md)$/.test(normalized)
  );
}
