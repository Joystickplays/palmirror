export type ActionPrefix = "DO" | "SAY" | "ASK" | "STORY";

export interface ParsedActionMessage {
    prefix: ActionPrefix;
    text: string;
}

const ACTION_PREFIX_REGEX = /^(DO|SAY|ASK|STORY)\s+(.+)/i;

export function parseActionMessage(content: string): ParsedActionMessage | null {
    const match = content.match(ACTION_PREFIX_REGEX);
    if (!match) return null;
    const [, prefix, text] = match;
    return {
        prefix: prefix.toUpperCase() as ActionPrefix,
        text: text.trim(),
    };
}

const SECOND_PERSON_WORD_MAP: Record<string, string> = {
    "i'm": "you're",
    "im": "you're",
    "i've": "you've",
    "ive": "you've",
    "i'll": "you'll",
    "ill": "you'll",
    "i'd": "you'd",
    "id": "you'd",
    "i": "you",
    "me": "you",
    "my": "your",
    "mine": "yours",
    "myself": "yourself",
    "we": "you",
    "us": "you",
    "our": "your",
    "ours": "yours",
    "ourselves": "yourselves",
};

export function toSecondPerson(text: string): string {
    const tokens = text.split(/(\s+)/);
    return tokens
        .map((token) => {
            if (/^\s+$/.test(token) || token === "") return token;
            const stripped = token.replace(/[^A-Za-z']/g, "");
            if (!stripped) return token;
            const lower = stripped.toLowerCase();
            const replacement = SECOND_PERSON_WORD_MAP[lower];
            if (!replacement) return token;

            const leadingPunct = token.slice(0, token.length - stripped.length);

            if (stripped === stripped.toUpperCase()) {
                return leadingPunct + replacement.toUpperCase();
            }

            const leadingUpper = /^[A-Z]/.test(stripped);
            const capitalized = leadingUpper
                ? replacement.charAt(0).toUpperCase() + replacement.slice(1)
                : replacement;

            return leadingPunct + capitalized;
        })
        .join("");
}

export function formatActionForDisplay(parsed: ParsedActionMessage): string {
    switch (parsed.prefix) {
        case "DO": {
            let text = parsed.text;
            const leadingFirstPerson = text.match(
                /^(My|I'm|Im|I've|Ive|I'll|Ill|I'd|Id|I|we|we're|we've|we'll)\b\s*(.+)/i
            );
            if (leadingFirstPerson) {
                const token = leadingFirstPerson[1];
                const rest = leadingFirstPerson[2];
                const normalized = token.replace(/'/g, "").toLowerCase();
                if (normalized === "im") {
                    return `You're ${toSecondPerson(rest)}.`;
                }
                if (normalized === "ive") {
                    return `You've ${toSecondPerson(rest)}.`;
                }
                if (normalized === "ill") {
                    return `You'll ${toSecondPerson(rest)}.`;
                }
                if (normalized === "id") {
                    return `You'd ${toSecondPerson(rest)}.`;
                }
                if (normalized === "my") {
                    return `Your ${toSecondPerson(rest)}.`;
                }
                text = rest;
            }
            return `You ${toSecondPerson(text)}.`;
        }
        case "SAY":
            return `You say, "${parsed.text}"`;
        case "ASK":
            return `You ask, "${parsed.text}"`;
        case "STORY":
            return `Then, ${parsed.text}`;
    }
}
