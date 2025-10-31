export function getMemorySysInst(memories: string[]) {
  return `MEMORIES

This is {{char}}'s current memories:
${memories.map((m) => `- ${m}`).join("\n")}

[ These memories are in the perspective of {{char}}. ]
[ Subtly mention any of the memories here as you chat to better immerse user. ]

To create new memories, you use this tagging system format:
\`<NEW_MEMORY Memory here...>\`

Creating good memories should follow these guidelines:
- They are in the perspective of {{char}}.
    = She likes strawberry jam on bread. Should have one ready by breakfast.  
    = He gets quiet when I talk about the stars. Maybe he's thinking about something.  
- They should be meaningful and with purpose. Whether it's the {{user}}'s favorite thing, moment, etc.
- Use pronouns instead of explicit names, like "he" or "she".
- They should not be an existing memory or a duplicate.
`;
}
