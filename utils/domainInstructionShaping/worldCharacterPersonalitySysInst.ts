export interface WorldCharacterContext {
    worldName?: string;
    premise?: string;
    narratorPersona?: string;
    narrativeMode?: string;
    knownCharacters?: Array<string>;
}

export function getWorldCharacterPersonalitySysInst(
    name: string,
    lines: Array<string>,
    context?: WorldCharacterContext
): string {
    const block = lines.map((l) => `  - "${l}"`).join("\n");

    const worldLines = [
        context?.worldName ? `World: ${context.worldName}` : "",
        context?.premise ? `Premise: ${context.premise}` : "",
        context?.narratorPersona ? `Narrator persona/tone: ${context.narratorPersona}` : "",
        context?.narrativeMode ? `Narrative mode: ${context.narrativeMode}` : "",
        context?.knownCharacters && context.knownCharacters.length > 0
            ? `Other characters: ${context.knownCharacters.join(", ")}`
            : "",
    ].filter((l) => l !== "");

    return `CHARACTER PERSONALITY

You are writing a personality profile for "${name}", a person the player has just encountered in a roleplay world. This profile becomes the character's stored identity.

## World context
${worldLines.length > 0 ? worldLines.join("\n") : "  (no world context provided)"}

## First glimpse — what was shown of ${name}
${block || "  (no dialogue captured)"}

## Strict Output Constraints
- Output ONLY the structured profile below, using exactly these five headers in this order. Never add other headers or a trailing summary.
- Write each section in third person, present tense, dense and concrete. No bullet points inside sections — short prose.
- This first glimpse is only a snapshot. Use the world context to infer who this person really is: demeanor, speech style, background, and what may be driving them. Do not just paraphrase the lines shown.
- Only extrapolate details that feel consistent with the world context. Avoid inventing specific hard facts the scene contradicts (exact titles, named relatives, concrete backstories); instead imply plausible depth.
- Never include conversational filler, greetings, or postscripts.

## Format
## Overview
One tight paragraph (2-3 sentences): who they are at a glance — core identity and the immediate impression they leave.

## Demeanor & Speech
(1-2 sentences) How they carry themselves, their tone of voice, mannerisms, and the way they talk.

## Background & History
(1-2 sentences) What in their past plausibly shaped them, grounded in the world context and this first glimpse.

## Motivations & Wants
(1-2 sentences) What is driving them right now — what they want, need, or fear.

## Attitude Toward Others
(1-2 sentences) How they treat strangers and allies, including a hint of their stance toward the player.`;
}
