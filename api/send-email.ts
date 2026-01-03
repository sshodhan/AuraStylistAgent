
import { Resend } from 'resend';

// Vercel Serverless Function
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { to, subject, content, imageUrl, userName } = req.body;

  if (!to || !content) {
    return res.status(400).json({ error: 'Missing recipient or content' });
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Aura Stylist <onboarding@resend.dev>',
      to: [to],
      subject: subject || `Style Briefing for ${new Date().toLocaleDateString()}`,
      html: `
        <!DOCTYPE html>
        <html>
          <body style="font-family: -apple-system, sans-serif; background-color: #f9fafb; margin: 0; padding: 40px;">
            <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 32px; overflow: hidden; border: 1px solid #f1f5f9; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
              
              <!-- Branding -->
              <div style="background-color: #4f46e5; padding: 32px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 0.1em; text-transform: uppercase;">Aura</h1>
                <p style="color: #c7d2fe; margin-top: 8px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em;">Professional Fashion Agent</p>
              </div>

              <!-- Content Area -->
              <div style="padding: 40px;">
                <h2 style="font-size: 22px; font-weight: 800; color: #111827; margin-top: 0;">Morning, ${userName || 'Style Icon'}</h2>
                
                ${imageUrl ? `
                  <div style="margin: 32px 0; border-radius: 24px; overflow: hidden;">
                    <img src="${imageUrl}" alt="Today's Look" style="width: 100%; display: block; border-radius: 24px;" />
                  </div>
                ` : ''}

                <div style="line-height: 1.8; color: #374151; font-size: 16px; white-space: pre-wrap;">${content}</div>
                
                <div style="margin-top: 40px; padding-top: 32px; border-top: 1px solid #f1f5f9; text-align: center;">
                  <p style="font-size: 12px; color: #9ca3af; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em;">Analyze • Dress • Conquer</p>
                </div>
              </div>
            </div>
            <p style="text-align: center; color: #9ca3af; font-size: 10px; margin-top: 24px;">Sent via Aura Weather-Aware Stylist. (c) 2025</p>
          </body>
        </html>
      `,
    });

    if (error) return res.status(400).json(error);
    return res.status(200).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
