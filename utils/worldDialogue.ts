export interface WorldDialogueSegment {
    type: "narration" | "speech";
    name?: string;
    text: string;
    isKnown?: boolean;
}

const NAME_CHUNK = "[^*\\n]{1,40}?";

interface Marker {
    rawName: string;
    index: number;
    afterIndex: number;
}

function scanMarkers(content: string): Array<Marker> {
    const markerRegex = new RegExp(`\\*\\*(${NAME_CHUNK})(?::\\*\\*|\\*\\*:)`, "gi");
    const markers: Array<Marker> = [];
    let match: RegExpExecArray | null;
    while ((match = markerRegex.exec(content)) !== null) {
        markers.push({ rawName: match[1].trim(), index: match.index, afterIndex: markerRegex.lastIndex });
    }
    return markers;
}

function splitQuotedFragments(text: string): Array<{ kind: "speech" | "narration"; text: string }> {
    const parts: Array<{ kind: "speech" | "narration"; text: string }> = [];
    const quoteRegex = /"([^"]*)"/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = quoteRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            const before = text.slice(lastIndex, match.index).trim();
            if (before) parts.push({ kind: "narration", text: before });
        }
        const inner = match[1].trim();
        if (inner) parts.push({ kind: "speech", text: inner });
        lastIndex = quoteRegex.lastIndex;
    }
    if (lastIndex < text.length) {
        const after = text.slice(lastIndex).trim();
        if (after) parts.push({ kind: "narration", text: after });
    }
    return parts;
}

function escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildAliasMap(names: string[]): { aliasPattern: string; aliasToCanonical: Map<string, string> } {
    const aliasToCanonical = new Map<string, string>();
    const aliasSet = new Set<string>();

    for (const name of names) {
        const trimmed = name.trim();
        if (trimmed === "") continue;

        const sanitized = trimmed
            .replace(/"([^"]*)"/g, "$1")
            .replace(/'([^']*)'/g, "$1");

        const words = sanitized.split(/\s+/).filter((w) => w !== "");
        const candidates = new Set<string>([trimmed, sanitized]);

        for (let i = 0; i < words.length && i < 2; i++) {
            candidates.add(words.slice(0, i + 1).join(" "));
        }

        for (const word of words) {
            if (word.length >= 3) candidates.add(word);
        }

        for (const candidate of candidates) {
            if (candidate === "") continue;
            const key = candidate.toLowerCase();
            aliasSet.add(candidate);
            if (!aliasToCanonical.has(key)) {
                aliasToCanonical.set(key, trimmed);
            } else if (aliasToCanonical.get(key) !== trimmed) {
                aliasToCanonical.delete(key);
            }
        }
    }

    const sortedAliases = [...aliasSet].sort((a, b) => b.length - a.length);
    return {
        aliasPattern: sortedAliases.map(escapeRegex).join("|"),
        aliasToCanonical,
    };
}

export function parseWorldDialogue(content: string, characterNames: string[]): Array<WorldDialogueSegment> {
    const validNames = characterNames
        .map((n) => n.trim())
        .filter((n) => n !== "");

    const { aliasToCanonical } = buildAliasMap(validNames);

    const markers = scanMarkers(content);
    if (markers.length === 0) return [{ type: "narration", text: content }];

    const segments: Array<WorldDialogueSegment> = [];
    let cursor = 0;

    for (let i = 0; i < markers.length; i++) {
        const m = markers[i];
        const canonical = aliasToCanonical.get(m.rawName.toLowerCase());

        if (!canonical && !isLikelySpeakerName(m.rawName)) continue;

        const name = canonical ?? m.rawName;
        const isKnown = canonical !== undefined;

        const nextIndex = i + 1 < markers.length ? markers[i + 1].index : content.length;
        const remainder = content.slice(m.afterIndex, nextIndex).trim();
        const hasQuote = /"/.test(remainder);

        if (m.index > cursor) {
            segments.push({
                type: "narration",
                text: content.slice(cursor, m.index),
            });
        }

        if (!hasQuote) {
            if (remainder !== "") {
                segments.push({ type: "speech", name, text: remainder, isKnown });
            }
        } else {
            const parts = splitQuotedFragments(remainder);
            const hasSpeechPart = parts.some((p) => p.kind === "speech");
            if (!hasSpeechPart) {
                if (remainder !== "") {
                    segments.push({ type: "speech", name, text: remainder, isKnown });
                }
            } else {
                for (const part of parts) {
                    if (part.kind === "speech") {
                        segments.push({ type: "speech", name, text: part.text, isKnown });
                    } else {
                        segments.push({ type: "narration", text: part.text });
                    }
                }
            }
        }

        cursor = nextIndex;
    }

    if (cursor < content.length) {
        segments.push({
            type: "narration",
            text: content.slice(cursor),
        });
    }

    if (segments.length === 0) return [{ type: "narration", text: content }];

    return segments;
}

const GENERIC_SPEAKER_STOPWORDS = new Set([
    "he", "she", "they", "them", "him", "her", "it", "we", "you", "i", "me", "us",
    "his", "hers", "its", "their", "theirs", "everyone", "somebody", "nobody",
    "narrator", "announcer", "voice", "guard", "soldier", "man", "woman", "child",
    "children", "stranger", "merchant", "servant", "king", "queen", "captain",
    "warning", "attention", "note", "status", "aside", "whisper", "sigh", "laugh",
    "cough", "murmur", "???", "?"
]);

function isLikelySpeakerName(name: string): boolean {
    const trimmed = name.trim();
    if (trimmed === "") return false;
    if (trimmed.length > 40) return false;
    if (/^\d+$/.test(trimmed)) return false;
    if (!/[A-Za-z]/.test(trimmed)) return false;

    const lower = trimmed.toLowerCase();
    if (GENERIC_SPEAKER_STOPWORDS.has(lower)) return false;
    if (/^(the|a|an)\s+/i.test(trimmed)) return false;
    if (lower === trimmed) return false;

    return true;
}
