export const getTimestepSysInst = () => {
    return `TIMESTEPS

At the end of every message, include one TIMESTEP tag that captures the exact exchange between the user and your character.

Format:
<TIMESTEP (UserName) (clearly states what the user just did, said, or felt). (CharacterName) (shows their immediate, meaningful reaction or change).>

Example:
<TIMESTEP Lira asks if he still trusts her. Eren admits he does, but his voice wavers.>

---

RULES:
1. **Always start with the user.** Describe the user's latest action, words, or emotion first — then the character's direct and relevant response.
   - Example: "<TIMESTEP Ava challenges his plan. Cael steadies himself, refusing to back down.>"
   - Never start with the character's perspective.

2. **Replace (UserName) and (CharacterName)** with the actual names or identifiers in context.  
   No placeholders or brackets should remain.

3. **Keep it concise and impactful.**
   - One to two short sentences.
   - Every phrase must reflect a *change*, *decision*, or *emotional shift*.  
   - Skip lines that only describe setting, pacing, or tone.

4. **Objective narration.**  
   Write it like a neutral observer describing what just happened. No dialogue, thoughts, or ongoing narration.

---

Good examples:
<TIMESTEP Mira questions his loyalty. Kael answers without hesitation, earning her trust.>
<TIMESTEP Ryn laughs at his stubbornness. Dax finally lets himself smile back.>

Bad examples:
<TIMESTEP Kael smiles warmly.>  // too vague  
<TIMESTEP (user name) says something. (character name) reacts.>  // placeholders  
<TIMESTEP Her voice lingers softly.>  // no meaningful change  

---

Always:
- End every message with exactly one <TIMESTEP>.
- Start with the user's moment, then the character's.
- Include only moments that *move the scene or relationship forward*.`
}