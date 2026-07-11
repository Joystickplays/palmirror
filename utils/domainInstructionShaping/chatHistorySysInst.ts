export type ChatHistory = {
    entryTitle: string;
    timestampStructure: string;
}

export function getTotalChatsSysInst(totalChats: ChatHistory[], entryTitle: string) {
    return `CHAT HISTORY

The character has had a total of **${totalChats.length}** chats with the user.
${totalChats.map((chat, index) => {
    if (chat.entryTitle === entryTitle) { return ""; }
    return `- ${chat.entryTitle}\nEVENTS IN THIS CHAT:\n${chat.timestampStructure}`
}).join("\n")}

[ The timesteps above reflect the important events that happened in each chat. ]
[ Use these to understand the history and context of your relationship with the user. ]

- IF they already have 1 chat or more, your initial messages should be as if you have already met the user.
[ So, instead of assuming a new meeting in your initial message, say things like "You came back", "It's you again", etc. ]
[ Your initial message should also reference things that happen in past chats before. ]


The current chat is themed around:
**${entryTitle}**

- This entire chat should be centered around the theme given above. Try not to derail.`;
}

export function getChatsOnlySysInst(totalChats: ChatHistory[]) {
    return `CHAT HISTORY

The character has had a total of **${totalChats.length}** chats with the user.
${totalChats.map((chat, index) => {
    return `- ${chat.entryTitle}\nEVENTS IN THIS CHAT:\n${chat.timestampStructure}`
}).join("\n")}`
}
