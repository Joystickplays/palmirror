"use client"

import { useEffect, useState, memo, useCallback, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Loader, SearchIcon } from "lucide-react"
import { motion } from "framer-motion"
import { searchCharacters, SearchResultItem } from "@/utils/searchUtils";
import { AnimateChangeInHeight } from "@/components/utilities/animate/AnimateHeight"

const CharacterButton = memo(({ char, idx, onSelect }: { 
    char: SearchResultItem, 
    idx: number, 
    onSelect: (char: SearchResultItem) => void 
}) => {
    return (
        <motion.button
            initial={{
                opacity: 0,
                x: -20
            }}
            animate={{
                opacity: 1,
                x: 0
            }}
            whileHover={{
                backgroundColor: "rgba(255, 255, 255, 0.01)",
                paddingRight: '20px',
                transition: {
                    type: 'spring',
                    mass: 1,
                    stiffness: 160,
                    damping: 20,
                    delay: 0
                }
            }}
            transition={{
                type: 'spring',
                mass: 1,
                stiffness: 160,
                damping: 20,
                // delay: idx * 0.1
            }}
            className="p-4 pl-12 cursor-pointer text-end relative h-28"
            onMouseDown={(e) => {
                e.preventDefault();
                onSelect(char);
            }}
        >
            <img src={char.image} alt={char.name} className="absolute left-0 top-0 h-full w-32 object-cover"
                style={{ maskImage: 'linear-gradient(to right, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0) 100%)' }}
            />
            <h1 className="font-extrabold z-10">{char.name}</h1>
            <p className="text-sm opacity-60 z-10">
                {char.description?.length > 50 ? `${char.description.slice(0, 50)}...` : char.description}
            </p>
        </motion.button>
    )
})
CharacterButton.displayName = "CharacterButton"

function SearchArea({
    setCharacterCardChar,
    setCharacterCardOpen
}: {
    setCharacterCardChar: (char: SearchResultItem) => void,
    setCharacterCardOpen: (open: boolean) => void
}) {
    const [searchBarFocused, setSearchBarFocused] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);

    const searchInput = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (searchQuery.trim().length === 0) {
            setSearchResults([]);
            return;
        }

        const delayDebounceFn = setTimeout(() => {
            (async () => {
                try {
                    setSearchLoading(true);
                    const results = await searchCharacters({
                        provider: 'janny.ai',
                        query: searchQuery,
                        page: 1,
                        excludeNsfw: false
                    });
                    setSearchResults(results);
                } catch (e) {
                    setSearchResults([]);
                    console.error('Search failed:', e);
                } finally {
                    setSearchLoading(false);
                }
            })();
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const handleSelectCharacter = useCallback((char: SearchResultItem) => {
        searchInput.current?.blur();
        setCharacterCardChar(char);
        setCharacterCardOpen(true);
        setSearchBarFocused(false);
    }, [setCharacterCardChar, setCharacterCardOpen]);

    return (
        <div className={`flex items-center justify-start gap-2 px-4 py-1 w-full sm:w-64 h-full rounded-full bg-white/5 border border-white/5 backdrop-blur-lg transition-all pointer-events-auto ${searchBarFocused ? "sm:w-84" : ""}`}>
            <div className="flex items-center justify-center gap-2">
                <SearchIcon className="opacity-80" />
                <Input
                    ref={searchInput}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setSearchBarFocused(true)}
                    onBlur={() => setTimeout(() => setSearchBarFocused(false), 200)}
                    placeholder="Search"
                    className="bg-transparent border-0 flex-2 w-full ring-0! ring-offset-0!"
                />
                <Loader className={`absolute right-4 top-1/2 -translate-y-1/2 animate-spin transition-opacity ${searchLoading ? "opacity-50" : "opacity-0"}`} />
            </div>
            <AnimateChangeInHeight
                className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 w-full bg-background border border-white/5 rounded-2xl transition-opacity ${searchBarFocused ? "opacity-100" : "opacity-0"} max-h-80 overflow-y-scroll`}>
                {searchBarFocused && (
                    searchResults.length < 1 ? (
                        <div className="p-4">
                            <p className="text-white/20 italic text-sm text-center">Search for something</p>
                        </div>) : (
                        <div className="p-0 flex flex-col">
                            {searchResults.map((char, idx) => (
                                <CharacterButton 
                                    key={char.id} 
                                    char={char} 
                                    idx={idx} 
                                    onSelect={handleSelectCharacter} 
                                />
                            ))}
                        </div>
                    )
                )}
            </AnimateChangeInHeight>
        </div>
    );
}

export default memo(SearchArea)