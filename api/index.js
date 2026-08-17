import worker from "../index.js";

export default async function handler(req, res) {
  const host = req.headers["host"] ?? "localhost";
  const incomingPath = req.url ?? "/";

  // Vercel rewrites /foo -> /api/foo. Strip the internal /api prefix
  // before handing the request to the original Anivexa router.
  const workerPath = incomingPath.replace(/^\/api(?=\/|\?|$)/, "") || "/";
  const url = `https://${host}${workerPath}`;

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = chunks.length ? Buffer.concat(chunks) : null;

  const request = new Request(url, {
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
