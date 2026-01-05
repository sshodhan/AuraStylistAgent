# Aura Identity Alignment & Rendering Guide (v2.4)

This guide outlines the mandatory protocols for maintaining subject identity (Gender & Age) across Aura’s Reasoning, Vision, and Motion engines.

## 1. The Core Problem: Gender-Clashing
"Gender-clashing" occurs when the AI reasoning suggests female-coded garments (e.g., "Midi Skirt") but the visual model renders a male-coded subject because the "Subject" prompt was too vague.

## 2. The Identity Lock Protocol
To prevent this, developers must ensure the `gender` and `ageRange` tokens are injected into **three distinct layers**:

### A. Semantic Layer (Reasoning)
The `getOutfitSuggestion` function must pass the user's gender and age to the LLM.
- **Goal**: Ensure the generated `OutfitSuggestion` JSON contains garments that logically match the subject's anatomy and societal style norms.
- **Instruction**: "Suggest silhouettes that strictly align with [gender] fashion standards."

### B. Vision Layer (Image Synthesis)
The `generateOutfitImage` function must use the **Identity Anchor** as the primary subject token.
- **Logic**: Instead of a generic "stylish person," the prompt must start with: `A stylish [Gender] in their [AgeRange]`.
- **Quality Control Block**: Every image prompt must include a directive: *"Ensure facial features and body silhouette strictly match a [Gender] subject. Do not mix gender traits."*

### C. Motion Layer (Veo Synthesis)
When generating video, the `prompt` must carry the `gender` token to ensure the model doesn't "re-roll" the person's gender during the runway animation.

## 3. Data Flow Architecture
```typescript
// 1. Storage: Persisted in localStorage as 'aura_gender' and 'aura_age_range'
// 2. Retrieval: UserProfile object in geminiService.ts
// 3. Injection: Hard-coded into prompt templates
```

## 4. Developer Guardrails
- **DO NOT** use neutral terms like "they" or "them" in the visual prompt if a specific gender is selected; use the explicit gender token.
- **DO NOT** allow the user to generate an image if the `gender` or `ageRange` fields are empty (defaults: Female, 30s).
- **MANDATORY**: For high-quality results, the `ageRange` token helps the model pick appropriate skin textures and facial maturity, preventing "baby-faced" or "ageless" hallucinations.

---
*Aura Identity & Safety Team | March 2025*