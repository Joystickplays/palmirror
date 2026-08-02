export interface WorldDialogueSegment {
    type: "narration" | "speech";
    name?: string;
    text: string;
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

    if (validNames.length === 0) return [{ type: "narration", text: content }];

    const { aliasPattern, aliasToCanonical } = buildAliasMap(validNames);

    const markerRegex = new RegExp(
        `\\*\\*(${aliasPattern}):\\*\\*\\s*(?:"([^"]*)"|([^\\n]*?(?=\\s*\\*\\*(?:${aliasPattern}):\\*\\*|$)))`,
        "gi"
    );

    const segments: Array<WorldDialogueSegment> = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = markerRegex.exec(content)) !== null) {
        const rawName = match[1].trim();
        const name = aliasToCanonical.get(rawName.toLowerCase()) ?? rawName;
        const quoted = match[2];
        const unquoted = match[3]?.trim();

        const speech = (quoted ?? unquoted ?? "").trim();

        if (match.index > lastIndex) {
            segments.push({
                type: "narration",
                text: content.slice(lastIndex, match.index),
            });
        }

        segments.push({
            type: "speech",
            name,
            text: quoted !== undefined ? quoted : speech.replace(/^"+|"+$/g, ""),
        });

        lastIndex = markerRegex.lastIndex;
    }

    if (lastIndex < content.length) {
        segments.push({
            type: "narration",
            text: content.slice(lastIndex),
        });
    }

    if (segments.length === 0) return [{ type: "narration", text: content }];

    return segments;
}
