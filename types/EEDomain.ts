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
}

export interface DomainTimestepEntry {
    key: number;
    associatedMessage: string;
    entry: string;
}

export interface EXDomain {
    active: boolean;
    memories: Array<DomainMemoryEntry>;
    attributes: Array<DomainAttributeEntry>;
    guide?: string;
    flashcards?: Array<DomainFlashcardEntry>;
}