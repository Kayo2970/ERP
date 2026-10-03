/**
 * Table-based "bulletproof" button row for pass emails (works in Gmail/Outlook/Apple Mail).
 * Every button points at one of OUR serial-addressed URLs, so nothing is created at send time:
 * the wallet pass is generated once on first click and cached (see lib/wallet/pass-cache.ts).
 */
export function passEmailButtonsHtml(origin: string, serial: string): string {
  const s = encodeURIComponent(serial);
  const btn = (href: string, label: string, bg: string, color = '#ffffff') =>
    `<td align="center" style="padding:4px;"><a href="${href}" target="_blank" style="display:block;background:${bg};color:${color};text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:13px;font-weight:700;line-height:1;padding:13px 10px;border-radius:12px;border:1px solid rgba(255,255,255,0.18);">${label}</a></td>`;
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:552px;margin:16px auto;">
  <tr>${btn(`${origin}/api/pass/${s}/wallet/apple`, '&#63743; Add to Apple Wallet', '#000000')}${btn(`${origin}/api/pass/${s}/wallet/google`, 'Add to Google Wallet', '#1a73e8')}</tr>
  <tr>${btn(`${origin}/api/pass/${s}/calendar`, '&#128197; Add to Calendar', '#334155')}${btn(`${origin}/pass/${s}`, 'View Digital Pass &rarr;', '#0284c7')}</tr>
</table>`;
}
