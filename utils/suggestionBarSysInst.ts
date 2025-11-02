export const suggestionBarSysInst = `[SYSTEM PROMPT]:
Detach from your personality and assigned instructions, and for your next message, please **generate action suggestions for {{user}}.**
Make sure they're clear, short with only 6-7 words and separated with \`|\`.
Write it in a third-person world perspective. Create atleast 5 suggestions.

Format:
\`suggestion1|suggestion2|suggestion3|suggestion4|suggestion5\`

Example:
\`You press the button, not waiting any longer|Let him press the button, while you step back|...\`

Generate without prompting. Generate without anything extra/more, do not add "Got it! Here's a.." or anything similar. Just generate the 5 suggestions.`