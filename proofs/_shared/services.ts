export interface ServiceInfo {
  /** Folder name under proofs/. */
  id: string;
  order: number;
  title: string;
  /** What Q must arrange before the proof can run. */
  blockedBy: string;
}

/** The 16 services in gate 0, in risk order (SPEC-integration-proofs.md). */
export const SERVICES: readonly ServiceInfo[] = [
  {
    id: "bolagsverket",
    order: 1,
    title: "Bolagsverket, värdefulla datamängder",
    blockedBy: "Godkänd ansökan",
  },
  {
    id: "m365-calendar",
    order: 2,
    title: "Microsoft Graph, kalender och ändringsnotiser",
    blockedBy: "Microsoft-testmiljö, appregistrering",
  },
  { id: "outlook-addin", order: 3, title: "Outlook-tillägg", blockedBy: "Microsoft-testmiljö" },
  {
    id: "bedrock",
    order: 4,
    title: "AWS Bedrock EU, huvud- och reservmodell",
    blockedBy: "AWS-konto, modellåtkomst",
  },
  { id: "crm", order: 5, title: "CRM, läsning", blockedBy: "Val av CRM, sandlådekonto" },
  { id: "m365-mail", order: 6, title: "Microsoft Graph, mejl", blockedBy: "Microsoft-testmiljö" },
  { id: "teams-delivery", order: 7, title: "Teams, leverans", blockedBy: "Microsoft-testmiljö" },
  {
    id: "entra-scim",
    order: 8,
    title: "Entra ID, inloggning och SCIM",
    blockedBy: "Microsoft-testmiljö",
  },
  { id: "workflow-engine", order: 9, title: "DBOS mot Temporal", blockedBy: "T10 klar" },
  { id: "scb", order: 10, title: "SCB företagsregister", blockedBy: "SCB-åtkomst" },
  { id: "jobtech", order: 11, title: "JobTech JobSearch (Platsbanken)", blockedBy: "–" },
  { id: "brave", order: 12, title: "Brave Search, webb och nyheter", blockedBy: "Brave-nyckel" },
  { id: "pressreleases", order: 13, title: "Pressmeddelanden", blockedBy: "Val av källa" },
  { id: "procurement", order: 14, title: "Upphandlingar", blockedBy: "Val av källa" },
  { id: "webfetch", order: 15, title: "Hämtning av bolagswebbplatser", blockedBy: "–" },
  { id: "langfuse", order: 16, title: "Langfuse EU", blockedBy: "Langfuse-konto" },
];
