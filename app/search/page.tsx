/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox"
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AnimatePresence, motion } from 'motion/react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { CharacterData, defaultCharacterData } from "@/types/CharacterData";

import { usePalRec } from "@/context/PLMRecSystemContext"

import AutoScrollContainer from '@/components/AutoScroll';
import { usePMNotification } from '@/components/notifications/PalMirrorNotification';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SearchResultItem {
  provider: 'chub.ai' | 'janny.ai';
  id: string;
  image: string;
  name: string;
  description: string;
  tags: string[];
  charLink: string;
}

interface JannyHit {
    id: string;
    name: string;
    description: string;
    avatar: string;
    tags?: { name: string }[] | string[];
    tagIds?: string[];
    isNsfw: boolean;
    totalToken: number;
}

interface JannyResponse {
    results: {
        hits: JannyHit[];
        estimatedTotalHits: number;
    }[];
}

export default function Search() {

  const PMNotify = usePMNotification();
  const router = useRouter();
  const { getRecommendedTags } = usePalRec();

  const [currentProvider, setCurrentProvider] = useState<'chub.ai' | 'janny.ai'>('chub.ai');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [exclusionTopic, setExclusionTopic] = useState("NSFW"); 
  const [excludeNSFW, setExcludeNSFW] = useState(true);  
  
  const [characterData, setCharacterData] = useState<CharacterData>(defaultCharacterData);

  useEffect(() => {
    const storedData = localStorage.getItem('characterData');
    if (storedData) {
      setCharacterData(JSON.parse(storedData));
    }
  }, []);

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
      .replace(/\s+/g, '-')     // Replace spaces with -
      .replace(/[^\w-]+/g, '')  // Remove all non-word chars
      .replace(/--+/g, '-')     // Replace multiple - with single -
      .replace(/^-+/, '')       // Trim - from start of text
      .replace(/-+$/, '');      // Trim - from end of text
  }

  const extractTags = (input: string): { exclusion: string; inclusion: string; clean: string } => {
    const exclusion: string[] = [];
    const inclusion: string[] = [];
    
    const words = input.split(/\s+/);
    const cleanWords = words.filter(word => {
        if (word.startsWith('-')) {
            exclusion.push(word.slice(1));
            return false;
        } else if (word.startsWith('+')) {
            inclusion.push(word.slice(1));
            return false;
        }
        return true;
    });

    return {
        exclusion: exclusion.join(','),
        inclusion: inclusion.join(','),
        clean: cleanWords.join(' ')
    };
  }


  const getChubCharacterAuthor = (url: string): string | null => {
    const match = url.match(/\/characters\/([^\/?]+)/);
    return match ? match[1] : null;
  };
  
  const getChubCharacterId = (url: string, author: string): string | null => {
    const match = url.match(new RegExp(`/${author}/([^/?)]+)`));
    return match ? match[1] : null;
  };
  
  const getImageBase64 = async (url: string): Promise<string> => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const startChubChat = (url: string) => {
    toast.promise(
      new Promise<void>(async (resolve, reject) => {
        try {
          const authorName = getChubCharacterAuthor(url);
          const response = await fetch(`https://api.chub.ai/api/characters/${authorName}/${getChubCharacterId(url, authorName || "")}?full=true`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
  
          const { name, personality, initialMessage, plmex, ...rest } = characterData;
  
          const imageUrl = data.node.avatar_url;
          const imageBase64 = await getImageBase64(imageUrl);
  
          setCharacterData(() => {
            const updatedData = {
              ...rest,
              name: data.node.definition.name,
              personality: data.node.definition.personality || data.node.definition.description,
              initialMessage: data.node.definition.first_message,
              alternateInitialMessages: data.node.definition.alternate_greetings && [data.node.definition.first_message, ...data.node.definition.alternate_greetings] || [],
              scenario: data.node.definition.scenario,
              image: imageBase64,
              tags: data.node.topics,
              plmex: defaultCharacterData.plmex,
            };
            localStorage.setItem('characterData', JSON.stringify(updatedData));
            return updatedData;
          });
          
          sessionStorage.removeItem("chatSelect");
          router.push("/chat");
          resolve();
        } catch (error) {
          console.error(error)
          reject(new Error(`Failed to fetch character data: ${error}`));
        }
      }),
      {
        pending: "Downloading character...",
        success: "Character loaded!",
        error: "Failed to download character.",
      }
    );
  };

  const startJannyAIChat = (id: string) => {
    toast.promise(
      new Promise<void>(async (resolve, reject) => {
        try {
          const response = await fetch(`https://whateverorigin.org/get?url=${encodeURIComponent(`https://jannyai.com/api/v1/characters/${id}`)}`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const raw = await response.json();
          const data = JSON.parse(raw.contents)
  
          const { name, personality, initialMessage, plmex, ...rest } = characterData;
  
          const imageUrl = "https://image.jannyai.com/bot-avatars/" + data.avatar;
          const imageBase64 = await getImageBase64(imageUrl);
  
          setCharacterData(() => {
            const updatedData = {
              ...rest,
              name: data.name,
              personality: `${data.personality || data.description}\n\nExample dialogs (chats resembling how {{char}} will speak):\n${data.exampleDialogs}`,
              alternateInitialMessages: [],
              initialMessage: data.firstMessage,
              scenario: data.scenario,
              image: imageBase64,
              tags: [],
              plmex: defaultCharacterData.plmex,
            } as CharacterData;
            localStorage.setItem('characterData', JSON.stringify(updatedData));
            return updatedData;
          });
          
          sessionStorage.removeItem("chatSelect");
          router.push("/chat");
          resolve();
        } catch (error) {
          console.error(error)
          reject(new Error(`Failed to fetch character data: ${error}`));
        }
      }),
      {
        pending: "Downloading character...",
        success: "Character loaded!",
        error: "Failed to download character.",
      }
    );
  };



  const handleResultClick = (result: SearchResultItem) => {
    if (result.provider === 'chub.ai') {
        startChubChat(result.charLink);
    } else if (result.provider === 'janny.ai') {
        startJannyAIChat(result.id);
    }
  };


  const apiProviders = {
    'chub.ai': {
      query: (extractedTags: any, page: number, exclusion: string, inclusion?: string) => {
         const cleanQuery = extractedTags.clean || "";
         return {
            url: `https://api.chub.ai/search?excludetopics=${exclusion}&first=20&page=${page}&namespace=*&search=${encodeURIComponent(cleanQuery)}&include_forks=true&nsfw=true&nsfw_only=false&require_custom_prompt=false&require_example_dialogues=false&require_images=false&require_expressions=false&nsfl=true&asc=false&min_ai_rating=0&min_tokens=50&max_tokens=100000&chub=true&require_lore=false&exclude_mine=true&require_lore_embedded=false&require_lore_linked=false&sort=default&topics=${inclusion || ''}&inclusive_or=false&recommended_verified=false&require_alternate_greetings=false&venus=true&count=false`,
            options: { method: 'GET' }
         }
      },
      processor: (data: any): SearchResultItem[] => {
        return data.data.nodes.map((item: any) => ({ 
            provider: 'chub.ai', 
            id: item.id || item.fullPath,
            image: item.avatar_url, 
            name: item.name, 
            description: item.tagline, 
            tags: item.topics, 
            charLink: `https://chub.ai/characters/${item.fullPath}` 
        }));
      }
    },
    'janny.ai': {
      query: (extractedTags: any, page: number, _exclusion: string, _inclusion?: string) => {
        const filters = ["totalToken <= 4101 AND totalToken >= 29"];
        if (excludeNSFW) {
            filters.push("isNsfw = false");
        }
        
        const q = extractedTags.clean || "";

        return {
            url: "https://search.jannyai.com/multi-search",
            options: {
                method: "POST",
                headers: {
                    "accept": "*/*",
                    "authorization": "Bearer 88a6463b66e04fb07ba87ee3db06af337f492ce511d93df6e2d2968cb2ff2b30", // this is fine
                    "content-type": "application/json",
                    "x-meilisearch-client": "Meilisearch instant-meilisearch (v0.19.0) ; Meilisearch JavaScript (v0.41.0)",
                    "Referer": "https://jannyai.com/"
                },
                body: JSON.stringify({
                    queries: [{
                        indexUid: "janny-characters",
                        q: q,
                        facets: ["isLowQuality", "tagIds", "totalToken"],
                        attributesToCrop: ["description:50"],
                        cropMarker: "...",
                        filter: filters,
                        attributesToHighlight: ["name", "description"],
                        highlightPreTag: "__ais-highlight__",
                        highlightPostTag: "__/ais-highlight__",
                        hitsPerPage: 20, 
                        page: page,
                        sort: ["createdAtStamp:desc"]
                    }]
                })
            }
        };
      },
      processor: (data: JannyResponse): SearchResultItem[] => {
        const hits = data.results[0]?.hits || [];
        return hits.map((item: JannyHit) => {
            let imageUrl = "";
            if (item.avatar) {
                imageUrl = item.avatar.startsWith('http') 
                    ? item.avatar 
                    : `https://image.jannyai.com/bot-avatars/${item.avatar}`;
            }

            const link = `https://jannyai.com/characters/${item.id}_character-${slugify(item.name)}`;

            return { 
                provider: 'janny.ai', 
                id: item.id,
                image: imageUrl, 
                name: item.name, 
                description: stripHtml(item.description), 
                tags: Array.isArray(item.tags) 
                    ? item.tags.map((t: any) => t.name || t) 
                    : [],
                charLink: link
            };
        });
      }
    }
  };


  const handleSearch = async (page = 1, initial?: boolean) => {
    if (!initial && !searchQuery && currentProvider === 'chub.ai') {
      PMNotify.error('Please enter a search query.');
      return;
    }

    const extractedTags = extractTags(searchQuery);

    let recommendedTags: string[] = [];
    if (initial && currentProvider === 'chub.ai') {
        try {
            recommendedTags = getRecommendedTags();
        } catch (e) { 
            console.log(e); 
            recommendedTags = ["NSFW", "RPG", "Robot"]; 
        }
    }

    setLoading(true);
    try {
      window.scrollTo(0, 0); 
      
      const providerConfig = apiProviders[currentProvider];
      console.log(currentProvider)
      
      const inclusionTags = initial ? recommendedTags.join(',') : extractedTags.inclusion;
      const exclusionTags = initial 
        ? "NSFW,RPG,Robot,Helpers,Milf" 
        : [exclusionTopic, extractedTags.exclusion].filter(Boolean).join(",");

      const { url, options } = providerConfig.query(extractedTags, page, exclusionTags, inclusionTags);

      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const processedResults = providerConfig.processor(data);

      setSearchResults(processedResults);
      setCurrentPage(page);
    } catch (error) {
      PMNotify.error(`Failed to search: ${(error as Error).message}`);
      console.error(error)
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
     handleSearch(1, true);
  }, [currentProvider]);

  return (
    <div className="flex flex-col gap-6 min-h-screen px-8 lg:px-48 pb-20 p-8 sm:p-10 font-(family-name:--font-geist-sans)">
      <div className="flex justify-center sm:justify-between w-full">
        <h1 className="text-xl font-extrabold tracking-tight">Search Characters</h1>
        <Button variant="outline" onClick={() => router.back()} className="hidden sm:block"> Back </Button>
      </div>
      
      <div className="flex flex-col gap-1">
        <div className="flex gap-4 flex-col sm:flex-row">
            <div className="flex gap-2 w-full">
                <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search on ${currentProvider === 'chub.ai' ? 'Chub.ai' : 'JannyAI'}...`}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch(1, false)}
                    className="w-full"
                />
                

                <Select onValueChange={(e) => {
                        setSearchResults([]); 
                        setCurrentProvider(e as 'chub.ai' | 'janny.ai');
                    }}
                    >
                  <SelectTrigger className="w-fit">
                    <SelectValue placeholder={'chub.ai'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chub.ai">chub.ai</SelectItem>
                    <SelectItem value="janny.ai">JannyAI</SelectItem>
                  </SelectContent>
                </Select>
                {/* <select 
                    className="h-10 px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={currentProvider}
                    onChange={(e) => {
                        setSearchResults([]); 
                        setCurrentProvider(e.target.value as 'chub.ai' | 'janny.ai');
                    }}
                >
                    <option value="chub.ai">Chub.ai</option>
                    <option value="janny.ai">JannyAI</option>
                </select>
                 */}
                <Button onClick={() => handleSearch(1, false)}>Search</Button>
            </div>
        </div>

        <div className="flex gap-2 items-center">
          <Checkbox checked={excludeNSFW} onCheckedChange={(ch) => {
              const isChecked = ch === true;
              setExcludeNSFW(isChecked); 
              if (isChecked) { setExclusionTopic("NSFW") } else { setExclusionTopic("") }
          }}/>
          <p>Exclude NSFW</p>
        </div>

        <div className="flex justify-between">
          <div>
            <p className="text-xs opacity-50">
              Results provided by <a target="_blank" href={currentProvider === 'chub.ai' ? "https://chub.ai" : "https://jannyai.com"} className="underline">
                  {currentProvider === 'chub.ai' ? "chub.ai" : "JannyAI"}
              </a>
            </p>
            {currentProvider === "janny.ai" && (
              <p className="text-xs opacity-50 text-red-300">
                Creating a new chat will proxy you through <a target="_blank" className="underline" href="https://whateverorigin.org/">whateverorigin.org</a>.
              </p>
            )}
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="p-1 px-2 h-6 text-xs">Search tips</Button>
            </PopoverTrigger>
          <PopoverContent asChild>
            <div className="font-sans flex flex-col gap-2">
              <p>{currentProvider === 'chub.ai' ? "Use + to require tags and - to exclude tags." : "Search works best with direct keywords."}</p>
              <hr />
              <div className="border rounded-xl p-2 w-full text-sm">
                 {currentProvider === 'chub.ai' ? "Knight +Male -Female" : "Bakugo Hero"}
              </div>
            </div>
          </PopoverContent>          
          </Popover>
        </div>
      </div>

      <div className="h-screen">
        <AnimatePresence mode="popLayout">
          {loading ? (
            <motion.div
              className="ellipsis-loader"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              key="loading"
            >
              <div></div>
              <div></div>
              <div></div>
              <div></div>
            </motion.div>
          ) : (
            <motion.div
            exit={{ filter: 'blur(5px)', opacity: 0}}>
                <motion.div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                  {searchResults.map((result, index) => (
                    <motion.div
                      key={result.id || index}
                      initial={{ opacity: 0, scale: 0, filter: 'blur(0px)' }}
                      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, scale: 0 }}
                      transition={{ delay: index * 0.05, type: "spring", mass: 1, damping: 15, stiffness: 80 }}
                      className="rounded-lg border shadow-md p-4 flex justify-between flex-col gap-4 relative overflow-hidden"
                    >
                      <div className="flex flex-col items-center gap-4">
                        <img src={result.image} alt={result.name}
                        className="absolute inset-0 top-0 left-0 right-0 bottom-0 w-full h-44 rounded-lg object-cover object-[50%_10%] z-[-5]"
                        style={{ maskImage: 'linear-gradient(to bottom, rgba(0, 0, 0, 1), transparent)' }} />
                        <div className="h-24"></div>
                        <div className="w-full">
                          <h2 className="text-lg font-semibold line-clamp-1">{result.name}</h2>
                          <p className="text-sm text-gray-500 line-clamp-3">{result.description}</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <AutoScrollContainer speed={0.5}>
                        <div className="flex gap-2">
                          {result.tags && result.tags.length > 0 ? result.tags.map((tag: string) => (
                            <span key={tag} className="px-2 py-1 border text-gray-500 text-xs rounded-md whitespace-nowrap"><p className="m-0 p-0">{tag}</p></span>
                          )) : <span className="text-xs text-gray-400">No tags</span>}
                        </div>
                        </AutoScrollContainer>
                        
                        <Button variant="outline" className="w-full" onClick={() => handleResultClick(result)}>
                           New Chat
                        </Button>
                      </div>
                    </motion.div>
                  ))}
              </AnimatePresence>
                </motion.div>
              {searchResults.length > 0 && (
                <div className="flex justify-center items-center mt-4 mb-20">
                  <Button
                    onClick={() => handleSearch(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="mx-4">
                    Page {currentPage}
                  </span>
                  <Button
                    onClick={() => handleSearch(currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <Dialog open={false}>
        <DialogContent className="font-sans">
          <DialogHeader>
            <DialogTitle>You are being blocked by Cloudflare</DialogTitle>
          </DialogHeader>
          <div className="opacity-80 flex flex-col gap-2 text-sm">
            <p>{`The request to the JannyAI character's data was unexpectedly blocked by Cloudflare.` +
              ` This is observed to be an anti-bot measure as their site's traffic continue to rise, mistaking ours as a bot.` +
              ` To get around this, you can visit the bot's page yourself and download the character card, and import it to PalMirror.`}</p>
          </div>
        </DialogContent>
      </Dialog>
      <ToastContainer
        autoClose={5000}
        closeOnClick
        draggable
        newestOnTop={false}
        pauseOnFocusLoss
        position="top-right"
        rtl={false}
        theme="dark"
      />
    </div>
  );
}