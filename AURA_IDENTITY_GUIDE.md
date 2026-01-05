# Aura Identity Alignment & Rendering Guide (v2.5)

This document is the "Source of Truth" for maintaining subject identity (Gender, Age, and Physique) across Aura's reasoning, vision, and motion pipelines.

## 1. The "Identity Lock" Architecture
To prevent "gender-clashing" (e.g., a male face appearing on female-coded garments), the application must enforce an **Identity Lock** at every stage of the generative pipeline.

### Layer 1: Semantic Reasoning (The Stylist)
The `getOutfitSuggestion` function must receive the user's `gender` and `ageRange`.
- **Developer Instruction**: The prompt must explicitly state: *"Suggest silhouettes that strictly align with [Gender] fashion standards."*
- **Purpose**: This ensures the text-based labels (e.g., "Tailored Chinos") match the visual expectations of the next engine.

### Layer 2: Visual Synthesis (The Virtual Mirror)
The `generateOutfitImage` function uses `gemini-3-pro-image-preview`.
- **Anchor Point**: The subject must be described as: *"A stylish [Gender] in their [AgeRange]"*.
- **Quality Guardrail**: You must append a negative constraint block:
  > *"CRITICAL: Ensure facial features and body silhouette strictly match a [Gender] subject. DO NOT mix gender traits. No male features on female clothing or vice versa."*

### Layer 3: Motion Synthesis (The Runway)
The `generateVeoVideo` function uses `veo-3.1-generate-preview`.
- **Consistency**: The motion prompt must carry the same identity tokens used in Layer 2.
- **Protocol**: If an `image` (start frame) and `lastFrame` (end frame) are provided, the prompt must reinforce: *"The subject in both frames is a [Gender]. Maintain strict identity consistency throughout the motion."*

## 2. Technical API Implementation (Veo 3.1)
The Veo model is a **Video Generation model**, not a text model.
- **Correct Method**: `ai.models.generateVideos(...)`.
- **Prohibited Config**: Do NOT pass `responseMimeType` or `responseSchema` to the Veo model. Doing so will result in a `400 INVALID_ARGUMENT` error.
- **Aspect Ratio**: Always use `9:16` for portrait mobile experiences or `16:9` for landscape.

## 3. Data Flow Persistence
1. User selects Identity Core in `SettingsTab.tsx`.
2. Data is saved to `localStorage` (`aura_gender`, `aura_age_range`).
3. `geminiService.ts` retrieves these tokens via `getUserProfile()` before every API call.

---
*Aura Identity & Safety Engineering | March 2025*