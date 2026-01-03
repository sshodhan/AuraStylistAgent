
# Aura: Weather-Aware Stylist - Vercel Handover

This document outlines the architecture and integration steps to provide to Vercel or your engineering team for a full-scale deployment.

## 1. App Approach
Aura is a "Reasoning Agent" that bridges real-time atmospheric data with generative AI fashion styling.
- **Frontend**: React-based SPA (Single Page Application) with a mobile-first design system.
- **Backend**: Serverless Node.js functions hosted on Vercel.
- **AI Stack**: 
  - `gemini-3-flash-preview`: Orchestrates text reasoning and email content generation.
  - `gemini-3-pro-image-preview`: Renders high-fidelity outfit visuals.
  - `gemini-2.5-flash-native-audio`: Powers the voice consultation mode.

## 2. Integration Architecture
### Email Pipeline
1. **Trigger**: User hits "Send Briefing" in the `SettingsTab`.
2. **Analysis**: Frontend calls Gemini to generate a personalized Markdown-style brief based on current location weather.
3. **Visualization**: Frontend calls the Image Studio to generate a 1K editorial image of the suggested look.
4. **Dispatch**: Frontend sends a POST request to `/api/send-email` with `userName`, `content`, and `imageUrl`.
5. **SMTP Relay**: Vercel Function uses the `resend` SDK to send a high-quality HTML email.

## 3. Required Environment Variables
To make this work on Vercel, the following secrets must be added to the project:

| Variable | Source | Description |
|----------|--------|-------------|
| `API_KEY` | Google AI Studio | Powers all Gemini AI models. |
| `RESEND_API_KEY` | Resend.com | Key starting with `re_...` for email delivery. |

## 4. Vercel Configuration Prompt
*You can use this prompt when setting up the Vercel project:*
> "This is a Vite/React application with a serverless backend located in /api/send-email.ts. It requires Node.js 18+ and handles email dispatching via Resend. The frontend uses Tailwind CSS for styling and requires access to GEOLOCATION and MICROPHONE permissions."

## 5. Deployment Commands
```bash
npm install
npm run build
vercel deploy --prod
```
