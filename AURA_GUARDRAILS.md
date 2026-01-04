# Aura AI Guardrails: Fashion Safety & Quality (v2.2)

This documentation describes the logic used to prevent rendering errors (e.g., missing pants/trousers) in the Aura Styling Agent.

## 1. Multi-Stage Guardrail Logic

### A. Semantic Layer (Reasoning)
The `gemini-3-flash-preview` model acts as the primary gatekeeper.
- **Constraint**: The `OutfitSuggestion` schema now includes a mandatory `lowerBody` field.
- **System Instruction**: Explicitly forbids suggestions that do not include a lower-body garment.
- **Outcome**: The agent cannot produce a styling verdict that is "incomplete" at the text level.

### B. Visual Layer (Prompt Engineering)
The `gemini-3-pro-image-preview` model receives reinforced instructions.
- **Layered Visibility**: The prompt forces the engine to render garments in a specific order: `[Outerwear] -> [Base Layer] -> [Lower Body] -> [Footwear]`.
- **Modesty Anchor**: Includes negative constraints like "no bare legs" and "no missing garments."
- **Full-Body Context**: Explicitly requests a "Full-length shot" to ensure the frame includes the waist-to-ankle area even when long coats are suggested.

### C. Motion Layer (Temporal Consistency)
The `veo-3.1-generate-preview` model inherits these constraints.
- **Anchor Frame Guardrails**: By using the "Fit Check" images as start/end seeds, the video generation is tethered to the validated garments.
- **Frame Interpolation**: The motion engine is prompted to verify "anatomical layering" during synthesis to prevent fabric "ghosting" or disappearing trousers during movement.

## 2. Technical Implementation Details
- **File**: `services/geminiService.ts`
- **Functions**: `getOutfitSuggestion`, `generateOutfitImage`, `generateVeoVideo`.
- **Change Log (v2.2)**: 
  - Added `lowerBody` to JSON schema.
  - Refined `generateOutfitImage` prompt to emphasize visibility of all layers.
  - Added "Quality Reassurance" messages in the UI during synthesis.

---
*Aura Safety & Quality Team | March 2025*