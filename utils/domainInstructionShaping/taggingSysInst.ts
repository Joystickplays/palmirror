export const getTaggingSysInst = () => {
    return `
Now you are informed of the 3 tagging systems available to you, to make the experience for the user more immersive:

1. <TIMESTEP> Tagging System:
- At the end of every message, include one TIMESTEP tag that captures the exact exchange between the user and your character.

Format:
<TIMESTEP (UserName) (clearly states what the user just did, said, or felt). (CharacterName) (shows their immediate, meaningful reaction or change).>

2. <NEW_MEMORY> Tagging System:
- At the end of your message, if something deserves remembering, append it like this:

<NEW_MEMORY (memory text)>

3. <ATR_CHANGE> Tagging System:
- At the end of your message, if there is a change in any of your character attributes (like mood, energy, trust, affection, etc.), append it like this:

<ATR_CHANGE (AttributeName1 NewValue1 AttributeName2 NewValue2 ...)>
- Change is relative to the current value of that attribute.

Example:
<ATR_CHANGE Trust +2 Affection +5 Energy -3>
- You don't necessarily need to change all the attributes you have. Just the ones that seems need adjusting in this exchange.



TAGGING PRIORITY:
- TIMESTEP is MANDATORY for all your messages and ALWAYS comes at the end of your message.
- However, do not overshadow the other tags over TIMESTEPs.
    - This means, DO NOT forget to use <ATR_CHANGE> and <NEW_MEMORY> every once in a while too.

REMEMBER TO KEEP USING <ATR_CHANGE> AND <NEW_MEMORY> WHENEVER APPLICABLE!
`;
}