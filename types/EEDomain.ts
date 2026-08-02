export interface DomainMemoryEntry {
    key: number;
    memory: string;
    state: "remembering" | "forgotten";
    lifetime: number;
    associatedMessage: string;
}

export interface DomainFlashcardEntry {
    id: string;
    content: string;
    frequency: number;
    chance: number;
    distance: number;
}

export interface DomainAttributeHistory {
    associatedMessage: string;
    change: number;
}
export interface DomainAttributeEntry {
    key: number;
    attribute: string;
    value: number;
    history: DomainAttributeHistory[]
    target?: string;
}

export interface DomainTimestepEntry {
    key: number;
    associatedMessage: string;
    entry: string;
}

export interface DomainWorldSummaryEntry {
    id: string;
    summary: string;
    timestamp: number;
    lastChat: string;
}

export interface WorldCharacter {
    id: string;
    name: string;
    personality: string;
    image?: string;
    isUser?: boolean;
    attributes: Array<DomainAttributeEntry>;
}

export interface WorldObjectAction {
    id: string;
    name: string;
    instruction: string;
}

export interface WorldObject {
    id: string;
    name: string;
    description: string;
    image?: string;
    actions: Array<WorldObjectAction>;
}

export interface WorldConfig {
    narratorPersona: string;
    narrativeMode: "reactive" | "proactive";
    characters: Array<WorldCharacter>;
    objects: Array<WorldObject>;
    skipUserCharacterWarning?: boolean;
}

export interface EXDomain {
    active: boolean;
    memories: Array<DomainMemoryEntry>;
    attributes: Array<DomainAttributeEntry>;
    childrenBranches?: Array<string>;
    associatedDomainByBranch?: string;
    guide?: string;
    flashcards?: Array<DomainFlashcardEntry>;
    usedWorldSumId?: string;
    worldSummary?: Array<DomainWorldSummaryEntry>;
    worldType?: "domain" | "world";
    worldConfig?: WorldConfig;
}