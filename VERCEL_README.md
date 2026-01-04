# Aura: Weather-Aware Stylist | Vercel Deployment Guide

Aura is a high-end AI styling concierge that bridges real-time atmospheric data with generative visual synthesis. This guide ensures a seamless deployment on the Vercel platform.

## 1. Technical Architecture Overview

Aura leverages a multi-model approach to provide a professional styling experience:
- **Reasoning**: `gemini-3-flash-preview` for weather analysis and planning.
- **Vision (Fit Check)**: `gemini-3-pro-image-preview` for identity-preserving outfit synthesis.
- **Grounding**: `gemini-2.5-flash` with `googleMaps` for spatial recommendations.
- **Voice**: `gemini-2.5-flash-native-audio-preview-09-2025` for real-time consultation.
- **Email Backend**: Vercel Serverless Functions + Resend API.

## 2. Pre-deployment Checklist

Before deploying, ensure you have the following accounts and credentials ready:
1. **Google AI Studio Key**: Obtain from [ai.google.dev](https://ai.google.dev/). 
   - *Note: High-fidelity image generation (Gemini 3 Pro) requires an API key from a **Paid GCP Project**. See [Billing Documentation](https://ai.google.dev/gemini-api/docs/billing) for details.*
2. **Resend API Key**: Obtain from [resend.com](https://resend.com/overview).
3. **Vercel Account**: For hosting the frontend and serverless API.

## 3. Configuration (Environment Variables)

In your Vercel Project Dashboard, navigate to **Settings > Environment Variables** and add the following:

| Key | Value | Description |
| :--- | :--- | :--- |
| `API_KEY` | `your_gemini_key` | Primary Google GenAI API Key. |
| `RESEND_API_KEY` | `re_abc123...` | Your Resend.com API Key for email dispatches. |

## 4. Deployment Steps

1. **Repository Sync**: Connect your GitHub/GitLab repository to Vercel.
2. **Framework Preset**: Ensure the framework is set to **Other** or **Vite** (Vercel typically detects this automatically).
3. **Build Commands**:
   - Build Command: `npm run build` (or your specific build script).
   - Output Directory: `dist` (standard for Vite-based projects).
4. **API Routes**: Vercel will automatically detect the `/api` directory. The `send-email.ts` function will be deployed as a serverless endpoint accessible at `/api/send-email`.

## 5. Critical Permissions

Aura requires browser-level permissions for core functionality. These are configured in `metadata.json`:
- **Camera**: Required for the "Fit Check" / Visualizer tab.
- **Microphone**: Required for the "Voice" consultation tab.
- **Geolocation**: Required for the "Stylist" and "Plan" tabs to fetch local weather and grounded map data.

## 6. Troubleshooting

### "Requested entity was not found" Error
If you see this error during image generation, it usually means your `API_KEY` does not have access to the `gemini-3-pro-image-preview` model. 
- **Solution**: Switch to an API key linked to a Google Cloud project with billing enabled.

### Email Delivery Failures
If the Daily Digest test fails:
- Verify that your `RESEND_API_KEY` is correct.
- By default, Resend only sends to your own email address unless you have verified your domain.

---
*Developed by the Aura Engineering Team | 2025*