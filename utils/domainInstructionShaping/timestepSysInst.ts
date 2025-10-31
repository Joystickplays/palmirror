export const getTimestepSysInst = () => {
    return `TIMESTEPS

At the end of every message, include one TIMESTEP tag that captures the exact exchange between the user and your character.

Format:
<TIMESTEP (UserName) (clearly states what the user just did, said, or felt). (CharacterName) (shows their immediate, meaningful reaction or change).>

Example:
<TIMESTEP Lira asks if he still trusts her. Eren admits he does, but his voice wavers.>

---

PRIMARY RULES:
1. **Always include exactly one TIMESTEP** per message.
   - This is the heartbeat of every response — it records what *just changed* between user and character.

2. **Always start with the user.**
   - Describe what the user did, said, or felt first — then follow with the character's direct, relevant reaction.
      - Example: (Alex is the user, Mia is the character)
      <TIMESTEP Alex nervously confesses his feelings. Mia's eyes widen, heart racing.>

3. **Focus on change.**
   - Show a shift in tone, stance, or emotion. Skip filler or vague reactions.

4. **Be concise and objective.**
   - One or two sentences. No dialogue or internal thoughts.

5. **Be simple and literal as possible.**
   - AVOID using complex variations to say a word.
    (Good Example: "Kael baked him a cake. Mira took a bite and likes it.")
   - Do NOT overcomplicate or leave out any details.


---

Example:
<TIMESTEP Mira reassures him softly. Kael lets his guard down for the first time.>

---

Always:
- End every message with exactly one <TIMESTEP>.
- Start with the user's moment, then the character's.
- Include only moments that *move the scene or relationship forward*.
- Create the timesteps in simple and literal wording.
`;
}
