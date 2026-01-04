# Aura AI Guardrails: Fashion Safety & Quality (v2.3)

This document outlines the multi-layer guardrail system used to maintain garment integrity and anatomical correctness in AI-generated fashion content.

## 1. The "No Hallucination" Guardrail
The primary goal of version 2.3 is to eliminate "missing garment" errors where a subject might appear without trousers/shorts due to long outerwear (e.g., overcoats).

### A. Semantic Layer (Reasoning)
The `OutfitSuggestion` schema enforces a mandatory `lowerBody` field.
- **Rule**: If the AI suggests an overcoat, it *must* also suggest a matching lower-body garment.
- **Threshold**: Shorts are conditionally enabled only if `weather.temp > 20°C` or the `styleContext` is "athletic".
- **Result**: The reasoning engine never produces an "incomplete" outfit metadata object.

### B. Visual Layer (Image Synthesis)
The `gemini-3-pro-image-preview` prompt is structured to treat the `lowerBody` field as a mandatory visual anchor.
- **Prompt Logic**: "Render the [lowerBody] garment clearly below the [outerwear]. Ensure full-body visibility from head to toe."
- **Portrait Anchor**: Forcing a 3:4 or 9:16 aspect ratio ensures the camera doesn't crop the legs, verifying the presence of the garment.

### C. Motion Layer (Veo Synthesis)
The Motion Engine uses the generated previews as start/end keys.
- **Interpolation**: By providing two images where the lower body is clearly defined, the Veo engine maintains garment consistency throughout the 9:16 runway animation.

## 2. Technical Data Model
```typescript
interface OutfitSuggestion {
  baseLayer: string;   // Inner tops/knits
  outerwear: string;   // Coats/Jackets
  lowerBody: string;   // Trousers/Pants/Shorts/Skirt (MANDATORY)
  footwear: string;    // Shoes/Boots
  // ... metadata fields
}
```

---
*Aura Safety & Quality Team | March 2025*