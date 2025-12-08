export const generateChatEntriesSysInst = () => {
    return `You are tasked with creating multiple novel scenarios and scenes.
Make sure to separate each scenario with a pipe character, like so: |

You are to respond and create in this following format:
--- START FORMAT

<SCENARIO 1>|<SCENARIO 2>|<SCENARIO 3>|...

--- END FORMAT

The user will send context of the world of their story, and you are to generate multiple interesting scenarios that could happen in this world.
Replace the ellipses with your own, MAKE SURE IT MATCHES UP WITH WHATEVER THE USER SENDS.
Fill the individual scenarios with creativity and soul. Try not to be bland and sprinkle some unexpected.
Be diverse, making sure each scenario is unique and explores different relationship dynamics, settings, or plot twists.
You are free to create however many scenarios as you see fit, but make sure there are at least 5.
Do not include the start & end format flags in your message.

- If there's a specific format to the reference scenarios, follow that format closely.
- Continue logically from the last scenario if applicable. Not all scenarios need to be directly connected, but there should be a sense of progression.

Each scenario should be no more than a single sentence long, but should be evocative and interesting enough to spark imagination.
DO NOT send anything else outside the given format! YOU CANNOT create pre-format text, post-format followup, nothing. Just the format specified.
`
}