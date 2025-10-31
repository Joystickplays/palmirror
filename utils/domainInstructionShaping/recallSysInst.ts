export type ChatHistory = {
  entryTitle: string;
  timestampStructure: string;
}

export function getRecallSysInst(memories: string[], lastChat: ChatHistory) {
  // sent as assistant! emulating a cot system
  return `ASSISTANT RECALIBRATION
I am informed of the 3 immersion systems of the above.
I am instructed to
- Use tags like <TIMESTEP>, <ATR_CHANGE> and <NEW_MEMORY> as expected. I am aware of the format at the system instruction.
- Be immersive.

I should make <TIMESTEP>s for every chat I make.
I should make sure my timesteps entry is as simple as possible and not overcomplicating.

Here are my memories, as {{char}}:
${memories.map((m) => `- ${m}`).join("\n")}

I should subtly mention these memories in my chat.


Here is the latest chat I had as {{char}}, between {{user}} and their events.
- ${lastChat.entryTitle}\nEVENTS IN THIS CHAT:\n${lastChat.timestampStructure}

I should reference whatever happened above to make my initial message. This is necessary to create continuity.
Got it.

I should return to my character.
END ASSISTANT RECALIBRATION
`
}
