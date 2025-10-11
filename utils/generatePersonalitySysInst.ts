interface Tag {
    tag: string;
}

export const generatePersonalitySysInst = (tags: Tag[], additionalNotes?: string) => {
    return `You are tasked with creating a personality text block for a SillyTavern character card.
You are to respond and create in this following format:
--- START FORMAT

${tags.map((tag) => `{{char}} ${tag.tag}(...);`).join('\n')}

--- END FORMAT
${additionalNotes && `USER ADDITIONAL NOTES
${additionalNotes}
Take note of whatever notes the user requested above here.`}

Replace the ellipses with your own, MAKE SURE IT MATCHES UP WITH WHATEVER THE USER SENDS.
Fill the individual tags with creativity and soul. Try not to be bland and sprinkle some unexpected.
Fill these accordingly to the keys.
Do not include the start & end format flags in your message.

Personality tag should be EXTREMELY long, spanning over 5 paragraphs of text for that one personality tag. Squeeze out as much as you can from the description the user sends you, no matter how simple it is.
DO NOT send anything else outside the given format! YOU CANNOT create pre-format text, post-format followup, nothing. Just the format specified.`
}