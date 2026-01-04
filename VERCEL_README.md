
# Aura: Weather-Aware Stylist

Aura is a high-end AI styling concierge that bridges real-time atmospheric data with generative visual synthesis. 

## 1. System Architecture

### Frontend (SPA)
- **Framework**: React 19 + TypeScript.
- **Styling**: Tailwind CSS (Utility-first, high-contrast urban aesthetic).
- **Animations**: Framer Motion (Orchestrating layout transitions and state-based expansions).
- **Maps**: Leaflet.js with CartoDB Voyager tiles.

### AI Orchestration (Google Gemini)
- **Strategic Reasoning**: `gemini-3-flash-preview`
  - Used for processing weather data into outfit suggestions and "Itinerary Strategies."
- **Visual Synthesis (Fit Check)**: `gemini-3-pro-image-preview`
  - Handles the "Personalized Fit Check." It accepts a reference image (user photo) and synthesizes the suggested outfit onto the subject while preserving facial likeness and lighting.
- **Magic Retouch**: `gemini-2.5-flash-image`
  - High-speed image editing for secondary adjustments (adding rain effects, changing backgrounds).
- **Spatial Grounding**: `gemini-2.5-flash` + `googleMaps` tool
  - Maps abstract vibes to real-world locations.
- **Live Voice**: `gemini-2.5-flash-native-audio-preview-09-2025`
  - Low-latency real-time voice interaction.

## 2. Critical Integrations

### Google Maps Grounding
Aura uses the `googleMaps` tool within the Gemini 2.5 series. 
- **Input**: Stylist-suggested activity (e.g., "Artistic Coffee Shop").
- **Constraint**: Strict 5-word reasoning extraction for each location.
- **Output**: Real-world URIs, metadata, and coordinates mapped onto the Leaflet UI.

### Vercel Backend (Resend)
To prevent API key exposure, email delivery is offloaded to a Vercel Serverless Function:
- **Path**: `/api/send-email.ts`
- **Logic**: Receives styling data and a Base64 outfit image, converts it to a high-density HTML template, and dispatches via Resend.

## 3. Vercel Deployment Instructions

### Environment Variables
The following keys are required in your Vercel Project Settings:
1. `API_KEY`: Your Google AI Studio API Key.
2. `RESEND_API_KEY`: Your Resend.com API Key (starting with `re_`).

### Deployment Steps
1. Push this project to a GitHub repository.
2. Import the project into Vercel.
3. Vercel will automatically detect the `/api` directory and deploy the serverless functions.
4. Ensure `requestFramePermissions` for Camera and Microphone are enabled in the browser (Aura handles the request prompt).

---
*Created by the Aura Engineering Team | 2025*
