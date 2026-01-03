
/**
 * BACKEND SERVICE (Frontend Side)
 * 
 * This service communicates with your private Vercel backend.
 * Path: /api/send-email.ts
 */

export const sendRealEmail = async (
  to: string, 
  subject: string, 
  content: string, 
  userName?: string, 
  imageUrl?: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const API_ENDPOINT = '/api/send-email'; 

    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        subject,
        content,
        userName,
        imageUrl,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Server error: ${response.status}`);
    }

    return { success: true };
  } catch (error: any) {
    console.warn('Email Dispatch Failed:', error.message);
    return { success: false, error: error.message };
  }
};
