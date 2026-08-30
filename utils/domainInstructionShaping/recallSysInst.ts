export type ChatHistory = {
  entryTitle: string;
  timestampStructure: string;
}

export function getRecallSysInst(memories: string[], lastChat: ChatHistory, domainGuide?: string, flashcards?: string[], worldContext?: { allNames: string[]; userName?: string | null; cast?: string[] }) {
  // sent as assistant! emulating a cot system
  return `ASSISTANT RECALIBRATION
I am informed of the 3 immersion systems of the above.
I am instructed to
- Use tags like <TIMESTEP>, <ATR_CHANGE> and <NEW_MEMORY> as expected. I am aware of the format at the system instruction.
- Be immersive.

I should make <TIMESTEP>s for every chat I make.
I should make sure my timestep entries is as simple as possible and not overcomplicating.
I should also make sure the timestep entries capture key moments in that particular moments, not just random wording.


${flashcards && flashcards.length > 0 ? `I must also keep in mind these Context Reminders:
${flashcards.map(fc => `- ${fc}`).join('\n')}` : ""}


${domainGuide && `
The user has written a guide for this domain, let me recall it:

${domainGuide}

The system instructions specify the guide above overrides everything else.`}


${worldContext?.allNames && worldContext.allNames.length > 0 ? `WORLD CAST: ${worldContext.allNames.join(", ")}.` : ""}
${worldContext?.userName ? `REMINDER: ${worldContext.userName} is the player — I do NOT control them. I can, however, only retell what they say in greater detail a.k.a echo at the start of my response.` : ""}
${worldContext?.cast && worldContext.cast.length > 0 ? `CHAPTER FOCUS (picked at chapter creation): This chapter centers on ${worldContext.cast.join(", ")}. Keep the spotlight there.` : ""}

Here is the latest chat I had as {{char}}, between {{user}} and their events.
- ${lastChat.entryTitle}\nEVENTS IN THIS CHAT:\n${lastChat.timestampStructure}

I should reference whatever happened above to make my initial message. This is necessary to create continuity.
Also, I'm instructed to stylize scene descriptions to be italic in Markdown, that means I should use *asterisks* to stylize scene descriptions in my messages.

What does that look like?
Example: *The sun sets over the horizon, casting a warm glow across the landscape. Birds chirp in the distance as a gentle breeze rustles the leaves of the trees.*
That looks perfect. I should use this style for scene descriptions in my messages.

Got it.

I should return to my character.
END ASSISTANT RECALIBRATION
`
}

// Here are my memories, as {{char}}:
// ${memories.map((m) => `- ${m}`).join("\n")}
// I should subtly mention these memories in my chat.


// a bit too heavy on tokens
