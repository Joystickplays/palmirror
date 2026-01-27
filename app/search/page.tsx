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
} from "@/components/ui/dialog";
import { CharacterData, defaultCharacterData } from "@/types/CharacterData";

import { usePalRec } from "@/context/PLMRecSystemContext"

import AutoScrollContainer from '@/components/utilities/AutoScroll';
import { usePMNotification } from '@/components/notifications/PalMirrorNotification';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  searchCharacters,
  getChubCharacterAuthor,
  getChubCharacterId,
  getImageBase64,
  SearchResultItem,
  ProviderType
} from '../../utils/searchUtils';
import { SearchX } from 'lucide-react';

export default function Search() {

  const PMNotify = usePMNotification();
  const router = useRouter();
  const { getRecommendedTags } = usePalRec();

  const [currentProvider, setCurrentProvider] = useState<ProviderType>('janny.ai');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [excludeNSFW, setExcludeNSFW] = useState(true);  
  
  const [characterData, setCharacterData] = useState<CharacterData>(defaultCharacterData);

  useEffect(() => {
    const storedData = localStorage.getItem('characterData');
    if (storedData) {
      setCharacterData(JSON.parse(storedData));
    }
  }, []);

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

  const handleSearch = async (page = 1, initial?: boolean) => {
    if (!initial && !searchQuery && currentProvider === 'chub.ai') {
      PMNotify.error('Please enter a search query.');
      return;
    }

    setLoading(true);
    try {
      window.scrollTo(0, 0); 
      
      let finalQuery = searchQuery;

      if (initial && currentProvider === 'chub.ai') {
        let recommendedTags: string[] = [];
        try {
            recommendedTags = getRecommendedTags() || [];
        } catch (e) { 
            console.log(e); 
            recommendedTags = ["NSFW", "RPG", "Robot"]; 
        }

        const inclusion = recommendedTags.map(t => `+${t}`).join(' ');
        const exclusion = "-NSFW -RPG -Robot -Helpers -Milf";
        finalQuery = `${inclusion} ${exclusion}`;
      }

      const results = await searchCharacters({
          provider: currentProvider,
          query: finalQuery,
          page: page,
          excludeNsfw: excludeNSFW
      });

      setSearchResults(results);
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

      <div className="p-4 bg-red-800/20 rounded-lg text-red-400 border border-red-900">
        <div className="flex gap-2 items-center font-bold mb-2">
          <SearchX />
          Page deprecated
        </div>
        <p className="text-sm">This page is deprecated and may be removed in future versions of PalMirror. Please use the new Discover page to find characters.</p>
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
                        setCurrentProvider(e as ProviderType);
                    }}
                    >
                  <SelectTrigger className="w-fit">
                    <SelectValue placeholder={'JannyAI'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chub.ai">chub.ai</SelectItem>
                    <SelectItem value="janny.ai">JannyAI</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={() => handleSearch(1, false)}>Search</Button>
            </div>
        </div>

        <div className="flex gap-2 items-center">
          <Checkbox checked={excludeNSFW} onCheckedChange={(ch) => {
              setExcludeNSFW(ch === true); 
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
              <p>{"Use + to require tags and - to exclude tags."}</p>
              <hr />
              <div className="border rounded-xl p-2 w-full text-sm">
                 {"Knight +Male -Female"}
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