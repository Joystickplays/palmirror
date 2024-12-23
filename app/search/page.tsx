/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AnimatePresence, motion } from 'motion/react';

const apiProviders = [
  {
    query: (searchQuery: string, page: number) => `https://api.chub.ai/search?excludetopics=&first=20&page=${page}&namespace=*&search=${encodeURIComponent(searchQuery)}&include_forks=true&nsfw=true&nsfw_only=false&require_custom_prompt=false&require_example_dialogues=false&require_images=false&require_expressions=false&nsfl=true&asc=false&min_ai_rating=0&min_tokens=50&max_tokens=100000&chub=true&require_lore=false&exclude_mine=true&require_lore_embedded=false&require_lore_linked=false&sort=default&topics=&inclusive_or=false&recommended_verified=false&require_alternate_greetings=false&venus=true&count=false`,
    processor: (data: any) => data.data.nodes.map((item: any) => ({ provider: 'chub.ai', image: item.avatar_url, name: item.name, description: item.tagline, tags: item.topics, charLink: `https://chub.ai/characters/${item.fullPath}` }))
  },
];


export default function Search() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [characterData, setCharacterData] = useState<any>(null);
  const router = useRouter();
  
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
  
          const { name, personality, initialMessage, ...rest } = characterData;
  
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
            };
            localStorage.setItem('characterData', JSON.stringify(updatedData));
            return updatedData;
          });
  
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
  const handleSearch = async (page = 1) => {
    if (!searchQuery) {
      toast.error('Please enter a search query.');
      return;
    }

    setLoading(true);
    try {
      window.scrollTo(0, 0); // Scroll to the top
      const fetchPromises = apiProviders.map(provider =>
        fetch(provider.query(searchQuery, page)).then(response => {
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
        <p className="text-xs opacity-50">Search engine and content by <a href="https://chub.ai">chub.ai</a></p>
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
              <AnimatePresence mode="popLayout">
                <motion.div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {searchResults.map((result, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                      transition={{ delay: index * 0.1, type: "spring", mass: 1, damping: 15, stiffness: 80 }}
                      className="rounded-lg border shadow-md p-4 flex justify-between flex-col gap-4"
                    >
                      <div className="flex items-center gap-4">
                        <img src={result.image} alt={result.name} className="w-12 h-12 rounded-full" />
                        <div>
                          <h2 className="text-lg font-semibold">{result.name}</h2>
                          <p className="text-sm text-gray-500">{result.description}</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2 overflow-hidden">
                          {result.tags.map((tag: string) => (
                            <span key={tag} className="px-2 py-1 border text-gray-500 text-xs rounded-md whitespace-nowrap"><p className="m-0 p-0">{tag}</p></span>
                          ))}
                        </div>
                        <Button variant="outline" className="w-full" onClick={() => getChubaiInfo(result.charLink)}>New chat with them</Button>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
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
