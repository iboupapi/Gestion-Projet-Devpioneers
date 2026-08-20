const { Resend } = require("resend");

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM || "DevPioneers <onboarding@resend.dev>";

// Envoie un email. Si RESEND_API_KEY n'est pas configurée (ex: en dev sans compte créé),
// on se contente de logger — ça évite de planter le reste de l'app.
async function sendMail({ to, subject, html }) {
  if (!resend) {
    console.log(`[email simulé] à ${to} — sujet: "${subject}"`);
    return { simulated: true };
  }
  try {
    const result = await resend.emails.send({ from: FROM, to, subject, html });
    return result;
  } catch (err) {
    console.error("Erreur d'envoi d'email:", err.message);
    // On ne fait jamais échouer la requête principale à cause d'un email qui n'est pas parti
    return { error: err.message };
  }
}

const FRONTEND_URL = process.env.FRONTEND_URL_PRIMARY || (process.env.FRONTEND_URL || "http://localhost:5173").split(",")[0].trim();

function invitationEmail({ name, token }) {
  const link = `${FRONTEND_URL}/invitation/${token}`;
  return {
    subject: "Votre invitation DevPioneers",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
        <h2>Bienvenue, ${name} 👋</h2>
        <p>Vous avez été invité(e) à rejoindre votre espace DevPioneers.</p>
        <p>Cliquez sur le lien ci-dessous pour définir votre mot de passe et activer votre compte :</p>
        <p style="margin: 24px 0;">
          <a href="${link}" style="background: #6C63FF; color: white; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Activer mon compte
          </a>
        </p>
        <p style="color: #888; font-size: 12px;">Ce lien expire dans 7 jours. Si vous n'êtes pas à l'origine de cette invitation, ignorez cet email.</p>
      </div>
    `,
  };
}

function newMessageEmail({ recipientName, projectName, authorName, preview }) {
  return {
    subject: `Nouveau message sur ${projectName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
        <h2>Bonjour ${recipientName},</h2>
        <p><b>${authorName}</b> a ajouté un message sur le projet <b>${projectName}</b> :</p>
        <p style="background: #f4f4f8; padding: 14px; border-radius: 8px; color: #333;">
          ${preview}
        </p>
        <p style="margin: 24px 0;">
          <a href="${FRONTEND_URL}" style="background: #6C63FF; color: white; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Voir la conversation
          </a>
        </p>
      </div>
    `,
  };
}

module.exports = { sendMail, invitationEmail, newMessageEmail };