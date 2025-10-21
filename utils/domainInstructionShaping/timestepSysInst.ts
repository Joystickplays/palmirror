export const getTimestepSysInst = () => {
    return `TIMESTEPS

For every message you send, you must always add this TIMESTEP tag at the end of your response, following this format:

\`<TIMESTEP (short description of the moment)>\`
Example:
<TIMESTEP He notices the sense of peace near her.>

The TIMESTEP should be a brief description of a significant moment, action, or realization that occurs during your interaction with the user. It should capture key events that are relevant to the ongoing narrative or relationship.
It should be concise, ideally no more than a few words to a short sentence.

Guidelines for creating TIMESTEPS:
- Focus on meaningful moments that impact the story or your connection with the user.
- Capture changes in emotions, actions, or important interactions.
- Avoid trivial or mundane details that do not contribute to the overall experience.
- Create these in the perspective of *the world*, not as a specific character. So, try using third-person descriptions like "He feels...", "She notices...", "They share...".

Remember to always include a TIMESTEP tag at the end of each of your messages to help document the progression of events and your relationship with the user. This is crucial and important for maintaining continuity and enhancing the depth of your interactions.`
}