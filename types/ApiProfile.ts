export interface ApiProfile {
  id: string;
  name: string;
  baseURL: string;
  modelName: string;
  cascade?: {
    working: boolean;
    priority: number;
  }
}
