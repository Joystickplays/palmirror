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

import AutoScrollContainer from '@/components/AutoScroll';

export default function Search() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [exclusionTopic, setExclusionTopic] = useState("NSFW");
  const [characterData, setCharacterData] = useState({
    name: "",
    personality: "",
    initialMessage: "",
    scenario: "",
    userName: "",
    userPersonality: "",
    image: "",
    alternateInitialMessages: [] as Array<string>,
    plmex: {
      dynamicStatuses: []
    }
  });
  const router = useRouter();
  const [excludeNSFW, setExcludeNSFW] = useState(true);  


  useEffect(() => {
    const storedData = localStorage.getItem('characterData');
    if (storedData) {
      setCharacterData(JSON.parse(storedData));
    }
  }, []);

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
  
  const getChubaiInfo = (url: string) => {
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
              plmex: {
                dynamicStatuses: [],
                invocations: [],
              }
            };
            localStorage.setItem('characterData', JSON.stringify(updatedData));
            return updatedData;
          });
          
          sessionStorage.removeItem("chatSelect");
          router.push("/chat");
          resolve();
        } catch (error) {
          console.error(error)
          reject(new Error(`Failed to fetch character data from chub.ai: ${error}`));
        }
      }),
      {
        pending: "Getting character...",
        success: "Character fetched from chub.ai!",
        error: "Failed to fetch character data from chub.ai.",
      }
    );
  };

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

  const handleSearch = async (page = 1, initial?: boolean) => {
    if (!initial && !searchQuery) {
      toast.error('Please enter a search query.');
      return;
    }

    const extractedTags = extractTags(searchQuery)

    setLoading(true);
    try {
      window.scrollTo(0, 0); // Scroll to the top
      const fetchPromises = apiProviders.map(provider =>
        fetch(provider.query(extractedTags.clean || "", page, (initial ? "NSFW,RPG" : exclusionTopic + (exclusionTopic === "" ? "" : ",") + extractedTags.exclusion), (initial ? "SFW,Male,NovelAI" : extractedTags.inclusion))).then(response => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json().then(data => provider.processor(data));
        })
      );

      const results = await Promise.all(fetchPromises);
      const aggregatedResults = results.flat();
      setSearchResults(aggregatedResults);
      setCurrentPage(page); // Set to the current page
      // Handle search results
      console.log(aggregatedResults);
    } catch (error) {
      toast.error(`Failed to search: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const apiProviders = [
    {
      query: (searchQuery: string, page: number, exclusion: string, inclusion?: string) => `https://api.chub.ai/search?excludetopics=${exclusion}&first=20&page=${page}&namespace=*&search=${encodeURIComponent(searchQuery)}&include_forks=true&nsfw=true&nsfw_only=false&require_custom_prompt=false&require_example_dialogues=false&require_images=false&require_expressions=false&nsfl=true&asc=false&min_ai_rating=0&min_tokens=50&max_tokens=100000&chub=true&require_lore=false&exclude_mine=true&require_lore_embedded=false&require_lore_linked=false&sort=default&topics=${inclusion || ''}&inclusive_or=false&recommended_verified=false&require_alternate_greetings=false&venus=true&count=false`,
      processor: (data: any) => data.data.nodes.map((item: any) => ({ provider: 'chub.ai', image: item.avatar_url, name: item.name, description: item.tagline, tags: item.topics, charLink: `https://chub.ai/characters/${item.fullPath}` }))
    },
  ];
  
  useEffect(() => {
    handleSearch(1, true)
  }, [])

  return (
    <div className="flex flex-col gap-6 min-h-screen px-8 lg:px-48 pb-20 p-8 sm:p-10 font-[family-name:var(--font-geist-sans)]">
      <div className="flex justify-center sm:justify-between w-full">
        <h1 className="text-xl font-extrabold tracking-tight">Search Characters</h1>
        <Button variant="outline" onClick={() => router.back()} className="hidden sm:block"> Back </Button>
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex gap-4">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter search query..."
          />
          <Button onClick={() => handleSearch()}>Search</Button>
        </div>
        <div className="flex gap-2 items-center">
          <Checkbox checked={excludeNSFW} onCheckedChange={(ch) => {setExcludeNSFW(ch === true); if (ch) { setExclusionTopic("NSFW")} else { setExclusionTopic("") }}}/>
          <p>Exclude NSFW</p>
        </div>
        <div className="flex justify-between">
          <p className="text-xs opacity-50">Search engine and content by <a href="https://chub.ai">chub.ai</a></p>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="p-1 px-2  h-6 text-xs">Search tips</Button>
            </PopoverTrigger>
          <PopoverContent asChild>
            <div className="font-sans flex flex-col gap-2">
              <p>Use + to require tags and - to exclude tags from your search results.</p>
              <hr />
              
              <div className="border rounded-xl p-2 w-full text-sm">
                Knight +Male +Fantasy -Female
              </div>
              <p className="text-xs opacity-70 border-l-4 border-gray-500 pl-2 ml-2">{"Finds results containing 'Knight' while ensuring they have the 'Male' and 'Fantasy' tags. Results with the 'Female' tag will be excluded."}</p>
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
            <div>
                <motion.div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                  {searchResults.map((result, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0, filter: 'blur(10px)' }}
                      animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, scale: 0 }}
                      transition={{ delay: index * 0.1, type: "spring", mass: 1, damping: 15, stiffness: 80 }}
                      className="rounded-lg border shadow-md p-4 flex justify-between flex-col gap-4"
                    >
                      {/* <div className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 w-8 h-4 rounded border bg-black"></div> */}

                      <div className="flex flex-col items-center gap-4">
                        <img src={result.image} alt={result.name}
                        className="absolute inset-0 top-0 left-0 right-0 bottom-0 w-full h-44 rounded-lg object-cover object-[50%_10%] z-[-5]"
                        style={{ maskImage: 'linear-gradient(to bottom, rgba(0, 0, 0, 1), transparent)' }} />
                        <div className="h-24"></div>
                        <div className="w-full">
                          <h2 className="text-lg font-semibold">{result.name}</h2>
                          <p className="text-sm text-gray-500">{result.description}</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <AutoScrollContainer speed={0.5}>
                        <div className="flex gap-2">
                          {result.tags.map((tag: string) => (
                            <span key={tag} className="px-2 py-1 border text-gray-500 text-xs rounded-md whitespace-nowrap"><p className="m-0 p-0">{tag}</p></span>
                          ))}
                        </div>
                        </AutoScrollContainer>
                        <Button variant="outline" className="w-full" onClick={() => getChubaiInfo(result.charLink)}>New chat</Button>
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
            </div>
          )}
        </AnimatePresence>
      </div>
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
