// Envoie un e-mail au vendeur à chaque nouvelle commande. N'agit que si
// RESEND_API_KEY et VENDOR_NOTIFICATION_EMAIL sont configurés — sinon,
// répond simplement sans rien envoyer (aucune erreur côté client).

export async function POST(request) {
  const apiKey = process.env.RESEND_API_KEY;
  const vendorEmail = process.env.VENDOR_NOTIFICATION_EMAIL;

  if (!apiKey || !vendorEmail) {
    return Response.json({ skipped: true });
  }

  try {
    const { articleTitle, clientName, quantity, total, location } = await request.json();

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Imprim Boutik <onboarding@resend.dev>",
        to: [vendorEmail],
        subject: `Nouvelle commande — ${articleTitle}`,
        html: `
          <p>Une nouvelle commande vient d'être passée sur Imprim Boutik :</p>
          <ul>
            <li><b>Article :</b> ${articleTitle}</li>
            <li><b>Client :</b> ${clientName}</li>
            <li><b>Quantité :</b> ${quantity}</li>
            <li><b>Total :</b> ${total}</li>
            <li><b>Livraison :</b> ${location}</li>
          </ul>
          <p>Connectez-vous à l'espace vendeur pour la traiter.</p>
        `,
      }),
    });

    return Response.json({ sent: true });
  } catch (e) {
    console.error("notify-vendor error:", e);
    return Response.json({ sent: false });
  }
}
