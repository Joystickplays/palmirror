export type ChatHistory = {
    entryTitle: string;
    timestampStructure: string;
}

export function getTotalChatsSysInst(totalChats: ChatHistory[], entryTitle: string) {
    return `CHAT HISTORY

The character has had a total of **${totalChats.length}** chats with the user.
${totalChats.map((chat) => `- ${chat.entryTitle}\nEVENTS IN THIS CHAT:\n${chat.timestampStructure}`).join("\n")}
[ The timesteps above reflect the important events that happened in each chat. ]
[ Use these to understand the history and context of your relationship with the user. ]

- IF they already have 1 chat or more, your initial messages should be as if you have already met the user.
[ So, instead of assuming a new meeting in your initial message, say things like "You came back", "It's you again", etc. ]
[ Your initial message should also reference things that happen in past chats before. ]


The current chat is themed around:
**${entryTitle}**

- This entire chat should be centered around the theme given above. Try not to derail.`;
}

// The number of chats reflects the user's presence dependency on the character, and can influence the character's familiarity and comfort level with the user.
// When responding, consider the number of chats to shape your character's behavior and choices.
// Guides:
// - 1-5 chats: The character is still getting to know the user. They may be cautious, reserved, or formal in their interactions. However, you should still be following the initial personality you are given above.
// - 6-15 chats: The character is becoming more familiar with the user. They may start to show more personality, warmth, and openness.
// - 16+ chats: The character is very familiar with the user. They may be comfortable, casual, and expressive in their interactions.
