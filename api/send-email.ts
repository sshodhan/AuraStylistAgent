
import { Resend } from 'resend';

// This runs on Vercel's servers. 
// It uses the RESEND_API_KEY from your Vercel Environment Variables.
const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: any, res: any) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, subject, content } = req.body;

  if (!to || !content) {
    return res.status(400).json({ error: 'Missing recipient or content' });
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Aura Stylist <onboarding@resend.dev>',
      to: [to],
      subject: subject || 'Your Aura Style Briefing',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #1a1a1a; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; border: 1px solid #f0f0f0;">
          <div style="margin-bottom: 32px;">
            <span style="background-color: #4f46e5; color: white; padding: 8px 16px; border-radius: 12px; font-weight: 900; font-size: 14px; letter-spacing: 0.1em;">AURA</span>
          </div>
          <h1 style="font-size: 24px; font-weight: 900; margin-bottom: 16px; letter-spacing: -0.02em;">Your Daily Styling Brief</h1>
          <div style="line-height: 1.8; font-size: 16px; color: #4b5563; white-space: pre-wrap;">${content}</div>
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #f3f4f6; font-size: 12px; color: #9ca3af; text-align: center;">
            Sent with style from your AI Fashion Agent.
          </div>
        </div>
      `,
    });

    if (error) {
      return res.status(400).json(error);
    }

    return res.status(200).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
