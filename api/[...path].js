import worker from "../index.js";

export default async function handler(req, res) {
  const host = req.headers["host"] ?? "localhost";
  const incoming = new URL(req.url || "/", `https://${host}`);

  // Vercel routes /episodes/... through /api/..., while the Anivexa
  // worker expects the original path without the /api prefix.
  if (incoming.pathname === "/api") {
    incoming.pathname = "/";
  } else if (incoming.pathname.startsWith("/api/")) {
    incoming.pathname = incoming.pathname.slice(4);
  }

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = chunks.length ? Buffer.concat(chunks) : null;

  const request = new Request(incoming.toString(), {
    method: req.method,
    headers: req.headers,
    body: body?.length ? body : undefined,
    duplex: "half",
  });

  const response = await worker.fetch(request, {});

  res.statusCode = response.status;
  for (const [k, v] of response.headers) res.setHeader(k, v);

  const buf = await response.arrayBuffer();
  res.end(Buffer.from(buf));
}
