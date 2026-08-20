export async function GET() {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID; // ex: ca-pub-1234567890123456
  const pubId = clientId ? clientId.replace("ca-pub-", "pub-") : null;

  const body = pubId ? `google.com, ${pubId}, DIRECT, f08c47fec0942fa0\n` : "";

  return new Response(body, {
    headers: { "Content-Type": "text/plain" },
  });
}
