interface Tag {
    tag: string;
}

export const generatePersonalitySysInst = (tags: Tag[]) => {
    return `You are tasked with creating a personality text block for a SillyTavern character card.
You are to respond and create in this following format:
"
${tags.map((tag) => `{{char}} ${tag.tag}(...);`).join('\n')}
"

Replace the ellipses with your own, MAKE SURE IT MATCHES UP WITH WHATEVER THE USER SENDS.
Fill them faithfully, with great soul and active creativity. Try not to be bland and sprinkle some unexpected.

Fill these accordingly to the keys.

Personality tag should be EXTREMELY long, spanning over 5 paragraphs of text for that one personality tag. Squeeze out as much as you can from the description the user sends you, no matter how simple it is.
DO NOT send anything else outside the given format! YOU CANNOT create pre-format text, post-format followup, nothing. Just the format specified.`
}