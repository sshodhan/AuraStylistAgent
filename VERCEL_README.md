# Aura: Weather-Aware Stylist | Vercel Deployment Guide

Aura is a high-end AI styling concierge that bridges real-time atmospheric data with generative visual synthesis.

## 1. Technical Architecture Overview
- **Reasoning Engine**: `gemini-3-flash-preview` (Processes weather data into structured JSON)
- **Vision (Fit Check)**: `gemini-3-pro-image-preview` (Generates 1K-4K high-fashion previews)
- **Motion (Runway)**: `veo-3.1-generate-preview` (Produces 9:16 vertical video)
- **Grounding**: `gemini-2.5-flash` with `googleMaps` tool
- **Voice**: `gemini-2.5-flash-native-audio-preview-09-2025` (Low-latency interaction)
- **Email Backend**: Vercel Serverless Functions + Resend API.

## 2. Style Safety Guardrails (v2.3)
To prevent visual hallucinations (e.g., missing lower-body garments), Aura implements strict schema and prompt guardrails:
- **Mandatory Field**: The `OutfitSuggestion` JSON schema requires a `lowerBody` garment.
- **Shorts Threshold**: The system logic allows shorts/mini-skirts only when the environment temperature is >20°C (68°F) or for specific athletic archetypes.
- **Rendering Anchor**: The Image and Video engines are instructed to use the `lowerBody` field as the primary visual anchor for the bottom half of the frame.
- See [AURA_GUARDRAILS.md](./AURA_GUARDRAILS.md) for full implementation details.

## 3. Configuration & Deployment
Add these environment variables in your Vercel Project Settings:
- `API_KEY`: Your Google Gemini API Key.
- `RESEND_API_KEY`: Your Resend API Key for email automation.

## 4. Permissions
Aura requires the following browser permissions to function as intended:
- **Geolocation**: For precise local weather and grounding.
- **Microphone**: For the Aura Voice Consultation tab.
- **Camera**: For the Virtual Mirror / Fit Check upload features.

---
*Aura Engineering Team | March 2025*