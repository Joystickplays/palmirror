export interface DynamicStatus {
  key: number;
  name: string;
  defaultValue: string;
}

export interface Invocation {
    key: number;
    type: "sound" | "image";
    trigger: string;
    condition: string;
    data: string;
}

export interface AlternateInitialMessage {
    name: string;
    initialMessage: string;
}

export interface DomainMemoryEntry {
    key: number;
    memory: string;
    state: "remembering" | "forgotten";
    lifetime: number;
}

export interface DomainAttributeEntry {
    key: number;
    attribute: string;
    value: string;
}

export interface CharacterData {
  image: string;
  name: string;
  personality: string;
  initialMessage: string;
  scenario: string;
  userName: string;
  userPersonality: string;
  tags: string[];
  alternateInitialMessages: Array<string> | Array<AlternateInitialMessage>;
  plmex: {
    domain: {
      active: boolean;
      memories: Array<DomainMemoryEntry>;
      attributes: Array<DomainAttributeEntry>;
    },
    dynamicStatuses: Array<DynamicStatus>;
    invocations: Array<Invocation>;
  };
}

export const defaultCharacterData: CharacterData = {
  image: "",
  name: "",
  personality: "",
  initialMessage: "",
  scenario: "",
  userName: "",
  userPersonality: "",
  tags: [],
  alternateInitialMessages: [],
  plmex: {
    domain: {
      active: false,
      memories: [],
      attributes: [],
    },
    dynamicStatuses: [],
    invocations: [], 
  }
};
