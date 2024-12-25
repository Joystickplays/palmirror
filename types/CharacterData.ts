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

export interface CharacterData {
  image: string;
  name: string;
  personality: string;
  initialMessage: string;
  scenario: string;
  userName: string;
  userPersonality: string;
  alternateInitialMessages: Array<string> | Array<AlternateInitialMessage>;
  plmex: {
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
  alternateInitialMessages: [],
  plmex: {
    dynamicStatuses: [],
    invocations: [], 
  }
};
