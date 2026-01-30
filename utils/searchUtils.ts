/* eslint-disable @typescript-eslint/no-explicit-any */
import { JannyTags } from '@/store/JannyTags';
import { CharacterData, defaultCharacterData } from '@/types/CharacterData';

export type ProviderType = 'chub.ai' | 'janny.ai';

export interface SearchResultItem {
  provider: ProviderType;
  id: string;
  image: string;
  name: string;
  description: string;
  tags: string[];
  charLink: string;
}

export interface SearchOptions {
  provider: ProviderType;
  query: string;
  page?: number;
  excludeNsfw?: boolean;
}


const stripHtml = (html: string) => {
    if (!html) return "";
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
};

const slugify = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
};

const extractTags = (input: string) => {
    const exclusion: string[] = [];
    const inclusion: string[] = [];
    
    const words = input.split(/\s+/);
    const cleanWords = words.filter(word => {
        if (word.startsWith('-')) {
            exclusion.push(word.slice(1).toLowerCase());
            return false;
        } else if (word.startsWith('+')) {
            inclusion.push(word.slice(1).toLowerCase());
            return false;
        }
        return true;
    });

    return {
        exclusion,
        inclusion,
        clean: cleanWords.join(' ')
    };
};

const getJannyTagIdFromName = (tagName: string) => {
    const normalized = tagName.toLowerCase();
    const tag = JannyTags.find(t => 
        t.slug.toLowerCase() === normalized || 
        t.name.toLowerCase() === normalized
    );
    return tag ? tag.id : null;
};

const getJannyTagIdFromId = (tagId: number) => {
    const tag = JannyTags.find(t => t.id === tagId);
    return tag;
};

export const getImageBase64 = async (url: string): Promise<string> => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
};


const PROVIDERS = {
    'chub.ai': {
        buildRequest: (cleanQuery: string, page: number, exclusion: string[], inclusion: string[], excludeNsfw: boolean) => {
            const params = new URLSearchParams({
                first: '20',
                page: page.toString(),
                namespace: '*',
                search: cleanQuery,
                include_forks: 'true',
                nsfw: (!excludeNsfw).toString(),
                nsfw_only: 'false',
                excludetopics: exclusion.join(','),
                topics: inclusion.join(','),
                sort: 'default',
                asc: 'false',
                min_ai_rating: '0',
                min_tokens: '50',
                max_tokens: '100000',
                chub: 'true',
                exclude_mine: 'true',
                venus: 'true'
            });
            
            return {
                url: `https://api.chub.ai/search?${params.toString()}`,
                options: { method: 'GET' }
            };
        },
        processResponse: (data: any): SearchResultItem[] => {
            return data.data.nodes.map((item: any) => ({ 
                provider: 'chub.ai' as const, 
                id: item.fullPath || item.id,
                image: item.avatar_url, 
                name: item.name, 
                description: item.tagline, 
                tags: item.topics, 
                charLink: `https://chub.ai/characters/${item.fullPath}` 
            }));
        },
        getCharacter: async (id: string): Promise<CharacterData> => {
            let cleanId = id;
            if (id.includes('chub.ai/characters/')) {
                const match = id.match(/chub\.ai\/characters\/([^\/?]+)\/([^\/?]+)/);
                if (match) cleanId = `${match[1]}/${match[2]}`;
            }

            const response = await fetch(`https://api.chub.ai/api/characters/${cleanId}?full=true`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            const node = data.node;
        
            const imageUrl = node.avatar_url;
            const imageBase64 = await getImageBase64(imageUrl);
        
            return {
                ...defaultCharacterData,
                name: node.definition.name,
                personality: node.definition.personality || node.definition.description,
                initialMessage: node.definition.first_message,
                alternateInitialMessages: (node.definition.alternate_greetings && [node.definition.first_message, ...node.definition.alternate_greetings]) || [],
                scenario: node.definition.scenario,
                tags: node.topics,
                image: imageBase64
            };
        }
    },
    'janny.ai': {
        buildRequest: (cleanQuery: string, page: number, exclusion: string[], inclusion: string[], excludeNsfw: boolean) => {
            const filters = ["totalToken <= 4101 AND totalToken >= 29"];
            
            if (excludeNsfw) filters.push("isNsfw = false");

            inclusion.forEach(tag => {
                const id = getJannyTagIdFromName(tag);
                if (id) filters.push(`tagIds = ${id}`);
            });

            exclusion.forEach(tag => {
                const id = getJannyTagIdFromName(tag);
                if (id) filters.push(`tagIds != ${id}`);
            });
            
            return {
                url: "https://search.jannyai.com/multi-search",
                options: {
                    method: "POST",
                    headers: {
                        "accept": "*/*",
                        "authorization": "Bearer 88a6463b66e04fb07ba87ee3db06af337f492ce511d93df6e2d2968cb2ff2b30",
                        "content-type": "application/json",
                        "x-meilisearch-client": "Meilisearch instant-meilisearch (v0.19.0) ; Meilisearch JavaScript (v0.41.0)",
                        "Referer": "https://jannyai.com/"
                    },
                    body: JSON.stringify({
                        queries: [{
                            indexUid: "janny-characters",
                            q: cleanQuery,
                            facets: ["isLowQuality", "tagIds", "totalToken"],
                            attributesToCrop: ["description:50"],
                            cropMarker: "...",
                            filter: filters,
                            attributesToHighlight: ["name", "description"],
                            highlightPreTag: "__ais-highlight__",
                            highlightPostTag: "__/ais-highlight__",
                            hitsPerPage: 20, 
                            page: page,
                            // sort: ["createdAtStamp:desc"]
                        }]
                    })
                }
            };
        },
        processResponse: (data: any): SearchResultItem[] => {
            const hits = data.results[0]?.hits || [];
            return hits.map((item: any) => {
                const imageUrl = item.avatar 
                    ? (item.avatar.startsWith('http') ? item.avatar : `https://image.jannyai.com/bot-avatars/${item.avatar}`)
                    : "";
                
                return { 
                    provider: 'janny.ai' as const, 
                    id: item.id,
                    image: imageUrl, 
                    name: item.name, 
                    description: stripHtml(item.description), 
                    tags: Array.isArray(item.tagIds) ? item.tagIds.map((t: any) => getJannyTagIdFromId(t)?.name || t) : [],
                    charLink: `https://jannyai.com/characters/${item.id}_character-${slugify(item.name)}`
                };
            });
        },
        getCharacter: async (id: string): Promise<CharacterData> => {
            const targetUrl = `https://jannyai.com/api/v1/characters/${id}`;
            const proxyUrl = `https://whateverorigin.org/get?url=${encodeURIComponent(targetUrl)}`;
            const response = await fetch(proxyUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const wrapper = await response.json();
            const data = JSON.parse(wrapper.contents);
        
            const imageUrl = "https://image.jannyai.com/bot-avatars/" + data.avatar;
            const imageBase64 = await getImageBase64(imageUrl);
        
            return {
                ...defaultCharacterData,
                name: data.name,
                personality: `${data.personality || data.description}\n\nExample dialogs (chats resembling how {{char}} will speak):\n${data.exampleDialogs}`,
                initialMessage: data.firstMessage,
                alternateInitialMessages: [],
                scenario: data.scenario,
                tags: [], 
                image: imageBase64
            };
        }
    }
};

export const searchCharacters = async ({ 
    provider, 
    query, 
    page = 1, 
    excludeNsfw = false 
}: SearchOptions): Promise<SearchResultItem[]> => {
    const { clean, exclusion, inclusion } = extractTags(query);
    const handler = PROVIDERS[provider];
    
    if (!handler) throw new Error(`Provider ${provider} not supported`);

    const { url, options } = handler.buildRequest(clean, page, exclusion, inclusion, excludeNsfw);
    
    try {
        const res = await fetch(url, options);
        if (!res.ok) throw new Error(`Search failed: ${res.statusText}`);
        const data = await res.json();
        return handler.processResponse(data);
    } catch (error) {
        console.error("Search API Error:", error);
        return [];
    }
};

export const fetchCharacter = async (provider: ProviderType, id: string): Promise<CharacterData> => {
    const handler = PROVIDERS[provider];
    if (!handler) throw new Error(`Provider ${provider} not supported`);
    
    return handler.getCharacter(id);
};