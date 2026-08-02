export interface DiscoveryCandidateInput {
    name: string;
    lines: Array<string>;
}

export function getWorldCharacterDiscoverySysInst(candidates: Array<DiscoveryCandidateInput>): string {
    const block = candidates
        .map(
            (c) =>
                `${c.name}:\n${c.lines.map((l) => `  - "${l}"`).join("\n")}`
        )
        .join("\n\n");

    return `CHARACTER DISCOVERY

You are scanning a roleplay chapter for people the player has just encountered. For each speaker below, write a short personality profile that will be stored as that character's identity.

## Strict Output Constraints
- Output ONLY the profiles, one per line, in the exact format:
  Name | personality
- "Name" must match the name given below exactly (fix obvious typos or spacing only).
- The personality is 1-2 sentences, third person, present tense, capturing who they are and how they come across (demeanor, speech style, vibe). Dense and concrete, no filler.
- Do not invent details beyond what the lines support.
- Never include conversational filler, greetings, or postscripts.

## Speakers to profile

${block}`;
}
