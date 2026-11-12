/**
 * MediNex Free Gmail Relay for Google Apps Script (HTTPS, zero third-party SaaS)
 *
 * Setup in ~2 minutes using your Gmail account (e.g. medinexbd.noreply@gmail.com):
 * 1. Go to https://script.google.com and create a "New project".
 * 2. Paste this entire file into Code.gs and replace REPLACE_WITH_YOUR_SECRET below
 *    with a strong random secret (set the exact same value as MAIL_WEBHOOK_SECRET in Railway).
 * 3. Click "Deploy" -> "New deployment" -> Type: "Web app":
 *      - Execute as: "Me"
 *      - Who has access: "Anyone"
 * 4. Click "Deploy", authorize Gmail/MailApp permission ("Advanced" -> "Go to ... (unsafe)" -> Allow),
 *    and copy the generated Web app URL (ends with /exec).
 * 5. Set MAIL_WEBHOOK_URL and MAIL_WEBHOOK_SECRET in Railway MediNex service Variables.
 */

const WEBHOOK_SECRET = 'REPLACE_WITH_YOUR_SECRET';

function doGet() {
  return jsonResponse({ ok: true, service: 'medinex-mail-relay' });
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ ok: false, error: 'Missing request body' });
    }

    const payload = JSON.parse(e.postData.contents);
    const configuredSecret =
      PropertiesService.getScriptProperties().getProperty('MAIL_WEBHOOK_SECRET') || WEBHOOK_SECRET;

    if (!configuredSecret || configuredSecret === 'REPLACE_WITH_YOUR_SECRET') {
      return jsonResponse({ ok: false, error: 'Webhook secret not configured in Apps Script' });
    }

    if (payload.secret !== configuredSecret) {
      return jsonResponse({ ok: false, error: 'Unauthorized' });
    }

    const to = String(payload.to || '').trim();
    const subject = String(payload.subject || '').trim();
    const body = String(payload.body || '');

    if (!to || !subject || !body) {
      return jsonResponse({ ok: false, error: 'Missing required fields: to, subject, body' });
    }

    const mailOptions = {
      to: to,
      subject: subject,
      body: body,
      name: String(payload.fromName || 'MediNex Platform').trim(),
    };

    const replyTo = String(payload.replyTo || '').trim();
    if (replyTo) {
      mailOptions.replyTo = replyTo;
    }

    MailApp.sendEmail(mailOptions);
    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
