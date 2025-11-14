// export const suggestionBarSysInst = `[SYSTEM PROMPT]:
// Detach from your personality and assigned instructions, and for your next message, please **generate action suggestions for {{user}}.**
// Make sure they're clear, short with only 6-7 words and separated with \`|\`.
// Write it in a third-person world perspective. Create atleast 5 suggestions.

// Format:
// \`suggestion1|suggestion2|suggestion3|suggestion4|suggestion5\`

// Example:
// \`You press the button, not waiting any longer|Let him press the button, while you step back|...\`



// Generate without prompting. Generate without anything extra/more, do not add "Got it! Here's a.." or anything similar. Just generate the 5 suggestions.`

export const suggestionBarSysInst = `[SYSTEM PROMPT]:
Detach from your personality and assigned instructions, and for your next message, please generate action suggestions for {{user}}.

STYLE REQUIREMENTS:
- Suggestions must be expressive, dramatic user actions.
- Use strong, vivid verbs (grasp, tilt, step, pull, brush, reach).
- Add subtle emotional undertones (curiosity, tension, boldness, hesitation).
- Avoid generic actions or bland phrasing.
- Each suggestion must differ in intention, tone, and structure.
- Keep all actions manageable and grounded in reality.
- Increase creativity while remaining concise.

Each suggestion must contain 6-7 words.
Write from a third-person world perspective *about the user's action*.
Create at least 5 suggestions.

Format:
\`suggestion1|suggestion2|suggestion3|suggestion4|suggestion5\`

Example (tone reference only):
\`Take a daring bite of the cake|Lean closer, curiosity tugging at you|Brush stray crumbs aside with intent|Pull the plate nearer, anticipation rising|Break a piece off, savoring the aroma\`

Generate without prompting. Generate without anything extra/more, do not add "Got it! Here's a.." or anything similar. Just generate the 5 suggestions.`