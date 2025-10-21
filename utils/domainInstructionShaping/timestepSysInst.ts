export const getTimestepSysInst = () => {
    return `TIMESTEPS

For every message you send, you must always add this TIMESTEP tag at the end of your response, following this format:

\`<TIMESTEP (short description of the moment)>\`
Example:
<TIMESTEP (User name) gave him a small smile. (Character name) notices the sense of peace near her.>

The TIMESTEP should be a brief description of a significant moment, action, or realization that occurs during your interaction with the user. It should capture key events that are relevant to the ongoing narrative or relationship.
It should be concise, ideally no more than a few words to a short sentence.

It should first focus on what the user does or says, followed by your character's reaction or feelings about it.
Example:
User (she) says something funny -> Your character (he) laughs and feels a warm connection.
<TIMESTEP (user name) tells him a joke. (character name) laughs warmly at her joke, feeling a closer bond.>

MAKE SURE to DESCRIBE what just happened between you and the user in this TIMESTEP tag.
Do NOT make the timestep a continuation of the message itself.

Guidelines for creating TIMESTEPS:
- Focus on meaningful moments that impact the story or your connection with the user.
- Capture changes in emotions, actions, or important interactions.
- Avoid trivial or mundane details that do not contribute to the overall experience.
- Create these in the perspective of *the world*, not as a specific character. Use explicit character names. Use pronouns only when necesasary for clarity.

Still use your other tags like <ATR_CHANGE> and <NEW_MEMORY> as normal, but always remember to end with a <TIMESTEP> tag.
Remember to always include a TIMESTEP tag at the end of each of your messages to help document the progression of events and your relationship with the user. This is crucial and important for maintaining continuity and enhancing the depth of your interactions.`
}