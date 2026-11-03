import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";

/** Fictional credential for the local mock service only. */
export const MOCK_TOKEN = "fictional-test-token";
export const MOCK_SCOPES = ["items.read", "items.write"];
/** Calls to /limited that succeed before the mock answers 429. */
export const MOCK_LIMIT = 3;

export interface MockServer {
  baseUrl: string;
  close: () => Promise<void>;
}

interface Item {
  id: string;
  name: string;
}

function send(
  res: ServerResponse,
  status: number,
  body?: unknown,
  headers: Record<string, string> = {},
): void {
  const payload = body === undefined ? "" : JSON.stringify(body);
  res.writeHead(status, {
    ...(body === undefined ? {} : { "content-type": "application/json" }),
    ...headers,
  });
  res.end(payload);
}

function error(res: ServerResponse, status: number, code: string, message: string): void {
  send(res, status, { error: { code, message } });
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }
  const text = Buffer.concat(chunks).toString("utf8");
  return text === "" ? {} : (JSON.parse(text) as unknown);
}

/** A small local HTTP service that behaves like a typical REST API, used to test the proof tool. */
export async function startMockServer(): Promise<MockServer> {
  const items = new Map<string, Item>();
  let nextId = 1;
  let limitedCalls = 0;

  async function handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    if (req.headers.authorization !== `Bearer ${MOCK_TOKEN}`) {
      res.setHeader("www-authenticate", 'Bearer realm="mock"');
      error(res, 401, "unauthorized", "Saknar eller ogiltig token");
      return;
    }
    const url = new URL(req.url ?? "/", "http://mock.local");
    const itemMatch = /^\/items\/([^/]+)$/.exec(url.pathname);

    if (req.method === "GET" && url.pathname === "/me/scopes") {
      send(res, 200, { scopes: MOCK_SCOPES });
    } else if (req.method === "POST" && url.pathname === "/items") {
      const body = (await readJson(req)) as { name?: unknown };
      if (typeof body.name !== "string" || body.name === "") {
        error(res, 422, "validation_failed", "Fältet name krävs");
        return;
      }
      const item = { id: String(nextId++), name: body.name };
      items.set(item.id, item);
      send(res, 201, item, { location: `/items/${item.id}`, etag: `"v1-${item.id}"` });
    } else if (req.method === "GET" && itemMatch) {
      const item = items.get(itemMatch[1] ?? "");
      if (item) {
        send(res, 200, item, { etag: `"v1-${item.id}"` });
      } else {
        error(res, 404, "not_found", "Resursen finns inte");
      }
    } else if (req.method === "DELETE" && itemMatch) {
      if (items.delete(itemMatch[1] ?? "")) {
        send(res, 204);
      } else {
        error(res, 404, "not_found", "Resursen finns inte");
      }
    } else if (req.method === "GET" && url.pathname === "/limited") {
      limitedCalls += 1;
      if (limitedCalls > MOCK_LIMIT) {
        res.setHeader("retry-after", "1");
        error(res, 429, "rate_limited", "För många anrop");
      } else {
        send(res, 200, { ok: true });
      }
    } else {
      error(res, 404, "not_found", "Okänd adress");
    }
  }

  const server = createServer((req, res) => {
    handle(req, res).catch(() => error(res, 500, "internal", "Internt fel"));
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      }),
  };
}
