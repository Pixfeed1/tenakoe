export function getSignature(user: { prenom: string; nom: string; email: string; telephone?: string | null; role?: string }): string {
  const tel = user.telephone?.trim();
  const poste = user.role === "ADMIN" ? "Responsable · TENAKOE" : "Chargée de projet · Kiwi";
  return `
<table style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.5; color: #374151;" border="0" cellspacing="0" cellpadding="0" align="left">
<tbody>
<tr>
<td style="padding-bottom: 12px;">
<span style="font-size: 12px; color: #6b7280;">Cordialement / Best regards / Saygılarımla / Com os melhores cumprimentos / Cordiali saluti / مع فائق الاحترام / Atentamente / Z poważaniem / Sinqerisht</span>
</td>
</tr>
<tr>
<td style="padding-bottom: 12px;"><img style="display: inline-block; height: 50px; width: auto;" src="${process.env.NEXTAUTH_URL || ""}/logotenakoe.png" alt="Tenakoe" height="50" /></td>
</tr>
<tr>
<td style="padding-bottom: 10px; border-bottom: 2px solid #16a34a;">
<p style="margin: 0 0 2px 0; font-size: 17px; font-weight: 600; color: #111827;">${user.prenom} ${user.nom.toUpperCase()}</p>
<p style="margin: 0; font-size: 13px; color: #16a34a;">${poste}</p>
</td>
</tr>
<tr>
<td style="padding-top: 10px;">
<p style="margin: 0; font-size: 13px; color: #6b7280;">${tel ? `<a style="color: #6b7280; text-decoration: none;" href="tel:${tel}">${tel}</a> · ` : ""}<a style="color: #6b7280; text-decoration: none;" href="mailto:${user.email}">${user.email}</a></p>
<p style="margin: 10px 0 0 0; font-size: 11px; color: #16a34a; font-style: italic;">Envie de sécuriser les contrôles et audits de votre qualification RGE? Faites équipe avec TENAKOE!</p>
</td>
</tr>
</tbody>
</table>`;
}
