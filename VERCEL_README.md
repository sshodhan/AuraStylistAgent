# Aura: Weather-Aware Stylist | Vercel Deployment Guide

Aura is a high-end AI styling concierge that bridges real-time atmospheric data with generative visual synthesis.

## 1. Technical Architecture Overview
- **Reasoning**: `gemini-3-flash-preview`
- **Vision (Fit Check)**: `gemini-3-pro-image-preview`
- **Motion (Runway)**: `veo-3.1-generate-preview` (See [AURA_MOTION_GUIDE.md](./AURA_MOTION_GUIDE.md) for portrait video specs)
- **Grounding**: `gemini-2.5-flash` with `googleMaps`
- **Voice**: `gemini-2.5-flash-native-audio-preview-09-2025`
- **Email Backend**: Vercel Serverless Functions + Resend API.

## 2. Pre-deployment Checklist
1. **Google AI Studio Key**: From [ai.google.dev](https://ai.google.dev/). 
   - *Note: Video and High-fidelity images require a Paid GCP Project.*
2. **Resend API Key**: From [resend.com](https://resend.com/overview).
3. **Vercel Account**: For hosting the frontend and serverless API.

## 3. Configuration
Add these in Vercel Settings:
- `API_KEY`: Your Gemini API Key.
- `RESEND_API_KEY`: Your Resend API Key.

## 4. Permissions
- **Camera/Microphone/Geolocation**: Essential for the "Mirror", "Voice", and "Local Finds" features.

---
*Aura Engineering Team | 2025*