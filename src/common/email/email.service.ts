import * as nodemailer from 'nodemailer';

export class MailService {
  private transporter = nodemailer.createTransport({
    service: process.env.MAIL_MAILER,
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });
  async sendOtp(email: string, code: string) {
    // Variables de style basées sur ta charte graphique
    const brandColor = '#0d9488'; // Teal
    const titleColor = '#f97316'; // Orange
    const bgColor = '#f9fafb'; // Surface

    await this.transporter.sendMail({
      from: `"VISA FOR CULTURE" <${process.env.MAIL_USER}>`,
      to: email,
      subject: `🔑 ${code} est votre code de vérification`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #111827; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          
          <div style="background-color: ${bgColor}; padding: 30px; text-align: center; border-bottom: 2px solid ${brandColor};">
            <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -1px; color: ${titleColor};">
              VISA <span style="color: #4b5563;">FOR CULTURE</span>
            </h1>
          </div>
          <div style="padding: 40px; background-color: #ffffff; text-align: center;">
            <div style="margin-bottom: 20px;">
              <h2 style="font-size: 20px; font-weight: 700; color: #111827;">Vérification de votre compte</h2>
              <p style="color: #6b7280; font-size: 16px;">Utilisez le code de sécurité ci-dessous pour valider votre opération :</p>
            </div>
            <div style="background-color: ${bgColor}; border: 2px dashed ${brandColor}; border-radius: 8px; padding: 20px; margin: 30px 0;">
              <span style="font-family: monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: ${brandColor};">
                ${code}
              </span>
            </div>
            <p style="font-size: 14px; color: #9ca3af; margin-bottom: 0;">
              Ce code est valide pendant <strong>10 minutes</strong>.<br>
              Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.
            </p>
          </div>
          <div style="background-color: #111827; padding: 20px; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #9ca3af;">
              &copy; ${new Date().getFullYear()} Visa For Culture - Abidjan, Côte d'Ivoire
            </p>
          </div>
        </div>
      `,
    });
  }
  async sendWelcomeEmail(email: string, name: string) {
    const brandColor = '#0d9488'; // Teal
    const titleColor = '#f97316'; // Orange
    const bgColor = '#f9fafb';

    await this.transporter.sendMail({
      from: `"VISA FOR CULTURE" <${process.env.MAIL_USER}>`,
      to: email,
      subject: `🌟 Bienvenue chez Visa For Culture, ${name} !`,
      html: `
      <div style="font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #111827; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb;">
        
        <div style="background-color: ${brandColor}; padding: 40px 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 900; color: #ffffff; letter-spacing: -1px;">
            BIENVENUE PARMI NOUS !
          </h1>
        </div>
        <div style="padding: 40px 30px;">
          <h2 style="color: ${titleColor}; font-size: 22px; font-weight: 700; margin-top: 0;">
            Salut ${name},
          </h2>
          <p style="font-size: 16px; color: #4b5563;">
            Nous sommes ravis de vous compter parmi la communauté <strong>Visa For Culture</strong>. 
            Préparez-vous à vivre des expériences culturelles inoubliables en Côte d'Ivoire.
          </p>
          <div style="margin: 30px 0; padding: 20px; background-color: ${bgColor}; border-radius: 12px;">
            <h3 style="margin-top: 0; font-size: 16px; color: ${brandColor};">Ce que vous pouvez faire maintenant :</h3>
            <ul style="padding-left: 20px; color: #4b5563; font-size: 14px;">
              <li style="margin-bottom: 10px;">Découvrir les <strong>événements exclusifs</strong> à venir.</li>
              <li style="margin-bottom: 10px;">Réserver vos tickets en quelques clics via <strong>Wave</strong>.</li>
              <li style="margin-bottom: 10px;">Tenter votre chance pour gagner des <strong>lots prestigieux</strong>.</li>
            </ul>
          </div>
          <div style="text-align: center; margin-top: 35px;">
            <a href="${process.env.FRONTEND_URL}/events" 
               style="background-color: ${titleColor}; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: 700; border-radius: 8px; display: inline-block; transition: background-color 0.3s;">
               Explorer les événements
            </a>
          </div>
        </div>
        <div style="padding: 20px 30px; background-color: ${bgColor}; border-top: 1px solid #e5e7eb; text-align: center;">
          <p style="font-size: 13px; color: #6b7280; margin-bottom: 15px;">
            Une question ? Notre équipe est là pour vous aider. Répondez simplement à cet email.
          </p>
          <div style="margin-bottom: 10px;">
             <span style="color: ${brandColor}; font-weight: 600;">#VisaForCulture #CultureCIV</span>
          </div>
        </div>
        <div style="padding: 20px; background-color: #111827; text-align: center;">
          <p style="margin: 0; font-size: 11px; color: #9ca3af; text-transform: uppercase; tracking-widest;">
            &copy; ${new Date().getFullYear()} Visa For Culture. Tous droits réservés.
          </p>
        </div>
      </div>
    `,
    });
  }
  async notifyPasswordChange(email: string, name: string) {
    // Variables de style basées sur ta charte graphique
    const brandColor = '#0d9488'; // Teal
    const titleColor = '#f97316'; // Orange
    const bgColor = '#f9fafb'; // Surface
    await this.transporter.sendMail({
      from: `"VISA FOR CULTURE" <${process.env.MAIL_USER}>`,
      to: email,
      subject: `✅Votre mot de passe a été modifié`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #111827; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          
          <div style="background-color: ${bgColor}; padding: 30px; text-align: center; border-bottom: 2px solid ${brandColor};">
            <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -1px; color: ${titleColor};">
              VISA <span style="color: #4b5563;">FOR CULTURE</span>
            </h1>
          </div>

          <div style="padding: 40px; background-color: #ffffff; text-align: center;">
            <div style="margin-bottom: 20px;">
              <h2 style="font-size: 20px; font-weight: 700; color: #111827;">Bonjour ${name},</h2>
              <p style="color: #4b5563; font-size: 16px;">
                Nous vous informons que le mot de passe de votre compte <strong>Visa For Culture</strong> a été modifié avec succès.
              </p>
            </div>

            <div style="margin: 30px 0;">
              <div style="display: inline-block; background-color: #f0fdf4; color: ${brandColor}; border-radius: 50%; padding: 20px; font-size: 40px;">
                🔒
              </div>
            </div>

            <div style="background-color: #fff7ed; border: 1px solid #ffedd5; border-radius: 8px; padding: 20px; margin-top: 30px;">
              <p style="font-size: 14px; color: #9a3412; margin: 0;">
                <strong>Ce n'était pas vous ?</strong><br>
                Si vous n'avez pas modifié votre mot de passe, nous vous recommandons de contacter immédiatement notre support ou de sécuriser votre compte.
              </p>
            </div>
          </div>

          <div style="background-color: #111827; padding: 20px; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #9ca3af;">
              &copy; ${new Date().getFullYear()} Visa For Culture - Abidjan, Côte d'Ivoire
            </p>
          </div>
        </div>
      `,
    });
  }
  //  SEND PDF TICKET
  async sendTicketsEmail(
    email: string,
    name: string,
    pdfBuffer: Buffer,
    eventName: string,
  ) {
    const brandColor = '#0d9488'; // Teal
    const titleColor = '#f97316'; // Orange
    const bgColor = '#f9fafb';

    await this.transporter.sendMail({
      from: `"VISA FOR CULTURE" <${process.env.MAIL_USER}>`,
      to: email,
      subject: `🎫 Vos tickets pour l'événement : ${eventName}`,
      html: `
      <div style="font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #111827; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb;">
        <div style="background-color: ${brandColor}; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 900; color: #ffffff;">VOS TICKETS SONT PRÊTS !</h1>
        </div>
        
        <div style="padding: 40px 30px; text-align: center;">
          <h2 style="color: ${titleColor}; font-size: 20px; font-weight: 700;">Félicitations ${name} !</h2>
          <p style="font-size: 16px; color: #4b5563;">
            Votre réservation pour <strong>${eventName}</strong> a été confirmée avec succès.
          </p>
          
          <div style="margin: 30px 0; padding: 20px; background-color: ${bgColor}; border-radius: 12px; border: 1px dashed ${brandColor};">
            <p style="margin: 0; color: #111827; font-weight: 600;">
              📎 Vous trouverez vos tickets en pièce jointe de cet email (format PDF).
            </p>
            <p style="font-size: 13px; color: #6b7280; margin-top: 10px;">
              Pensez à les présenter sur votre téléphone ou à les imprimer pour l'accès à l'événement.
            </p>
          </div>

          <p style="font-size: 14px; color: #9ca3af;">
            Merci de faire confiance à <strong>Visa For Culture</strong> pour vos sorties culturelles.
          </p>
        </div>

        <div style="padding: 20px; background-color: #111827; text-align: center;">
          <p style="margin: 0; font-size: 11px; color: #9ca3af;">
            &copy; ${new Date().getFullYear()} Visa For Culture - Abidjan, Côte d'Ivoire
          </p>
        </div>
      </div>
    `,
      attachments: [
        {
          filename: `Tickets-${eventName.replace(/\s+/g, '_')}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });
  }

  async sendContactEmail(data: {
    name: string;
    email: string;
    subject: string;
    message: string;
    phone?: string;
  }) {
    const { name, email, subject, message, phone } = data;

    // 1. Mail pour l'entreprise
    await this.transporter.sendMail({
      from: `"${name}" <${process.env.MAIL_USER}>`,
      to: process.env.MAIL_USER,
      replyTo: email,
      subject: `[CONTACT SITE] ${subject}`,
      html: `<h3>Nouveau message de ${name}</h3><p>${message}</p><p>Tel: ${phone}</p>`,
    });

    // 2. Mail de confirmation au client
    await this.transporter.sendMail({
      from: `"VISA FOR CULTURE" <${process.env.MAIL_USER}>`,
      to: email,
      subject: 'Accusé de réception',
      html: `<p>Bonjour ${name}, nous avons bien reçu votre message.</p>`,
    });
  }
}
