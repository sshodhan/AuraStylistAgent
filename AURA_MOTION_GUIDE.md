# Aura Technical Update: The Portrait Motion Engine (v2.1)

This document provides a technical overview of the recent changes to the **Aura Motion Engine**, focusing on the transition to high-fidelity portrait (9:16) video generation using Google's Veo model.

## 1. The Portrait Problem (Resolved)
Previous versions utilized a landscape aspect ratio (16:9) which resulted in subjects appearing compressed or "squashed" when viewed on mobile devices. 

**Update:** We have migrated to a strict **9:16 Portrait Aspect Ratio**.
- **Model:** `veo-3.1-generate-preview`
- **Configuration:** `aspectRatio: '9:16'`
- **Impact:** Subjects now maintain true-to-life proportions, allowing for full-body head-to-toe visualization of outfits.

## 2. Synthesis Logic: Frame-to-Frame Interpolation
To ensure the generated video maintains the specific identity of the outfit generated in the "Stylist" tab, we utilize a two-frame seed approach.

- **Start Frame (`image`):** Uses the first generated outfit preview.
- **End Frame (`lastFrame`):** Uses the second generated variation.
- **Interpolation:** The engine calculates the motion path between these two high-quality states, ensuring that the fabric textures, colors, and lighting remain consistent throughout the animation.

## 3. Natural Language Motion Control
We have integrated a voice-and-text command interface within the `VisualizeTab`.

- **Voice Engine:** Uses `webkitSpeechRecognition` (fixed in v2.1) for low-latency command capture.
- **Prompt Injection:** User commands (e.g., "walking towards the camera in rain") are dynamically combined with the Stylist's reasoning to create a context-aware cinematic prompt.
- **Stylist Context:** The engine automatically includes the `styleReasoning` and `weatherStory` from the current outfit to inform the background atmosphere and lighting.

## 4. UI/UX Refinement
The visualization interface has been updated to support the taller video format:
- **Responsive Modal:** The video player now scales vertically, occupying the majority of the viewport while maintaining a "Stories" vibe.
- **Glassmorphism Controls:** Playback and Download controls utilize high-blur backdrops to stay legible against complex generated video backgrounds.
- **Reassurance System:** Since Veo generation can take 60-120 seconds, the UI now cycles through specialized status updates to inform the user of the rendering progress (e.g., "Finalizing urban backdrop...").

## 5. Deployment Notes (Vercel)
- **Permissions:** Ensure `microphone` and `camera` permissions remain active in `metadata.json`.
- **API Timeout:** As video generation is an asynchronous long-running operation, the frontend handles the polling via `ai.operations.getVideosOperation`. No Vercel function timeout changes are required as the heavy lifting is done server-side by the Gemini API.

---
*Aura Engineering Team | March 2025*