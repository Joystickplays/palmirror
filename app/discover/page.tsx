"use client";

import React, { useCallback, useEffect, useState } from "react"
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input"
import { useSidebarStore } from "@/context/zustandStore/Sidebar"
import { searchCharacters, SearchResultItem } from "@/utils/searchUtils";
import { motion } from "framer-motion"
import { Loader, Search, SearchIcon } from "lucide-react"
import CharacterCatalog from "@/components/homescreen/CharacterCatalog";
import CharacterCardDrawer from "@/components/homescreen/CharacterCardDrawer";
import SearchArea from "@/components/homescreen/SearchArea";




export default function DiscoverPage() {

    const isOpen = useSidebarStore(s => s.isOpen)



    const [mustTryCharacters, setMustTryCharacters] = useState<SearchResultItem[]>([])
    const [popularCharacters, setPopularCharacters] = useState<SearchResultItem[]>([])
    const [TACCharacters, setTACCharacters] = useState<SearchResultItem[]>([])
    const [TACtags, setTACtags] = useState<string[]>([])


    const [searchQuery, setSearchQuery] = useState("");
    const [searchLoading, setSearchLoading] = useState(false);




    const [charCardOpen, setCharCardOpen] = useState(false);
    const [charCardData, setCharCardData] = useState<SearchResultItem | undefined>(undefined)

    useEffect(() => {
        (async () => {
            const result = await searchCharacters({
                provider: "janny.ai",
                query: "+Angst +Game +AnyPOV",
                excludeNsfw: false
            })

            setMustTryCharacters(result)
        })();

        (async () => {
            const result = await searchCharacters({
                provider: "janny.ai",
                query: "",
                excludeNsfw: false
            })

            setPopularCharacters(result)
        })();

        (async () => {

            const applicableTags = [
                "+Female",
                "+Male",
                "+Celebrity",
                "+Fictional",
                "+Game",
                "+Anime",
                "+Dominant",
                "+Submissive",
                "+Scenario",
                "+Books",
                "+AnyPOV",
                "+Angst",
                "+Fluff",
                "+Horror"
            ]

            const TACtags = applicableTags.toSorted(() => 0.5 - Math.random()).slice(0, 3)
            setTACtags(TACtags)

            const result = await searchCharacters({
                provider: "janny.ai",
                query: TACtags.join(' '),
                excludeNsfw: false,
                sortBy: 'totalToken:desc'

            })

            setTACCharacters(result)
        })();
    }, [])

    const handleCharacterClick = useCallback((char: SearchResultItem) => {
        setCharCardData(char);
        setCharCardOpen(true);
    }, []);


    return (
        <motion.div
            initial={{ marginLeft: !isOpen ? 0 : window.innerWidth > 640 ? 110 : 0 }}
            animate={{ marginLeft: !isOpen ? 0 : window.innerWidth > 640 ? 110 : 0 }}
            
            className="flex min-h-screen p-6 px-0 gap-4 font-sans!">

            <div className="top-0 left-0 flex fixed justify-end mr-4 p-8 w-full z-10 pointer-events-none">
                <SearchArea setCharacterCardChar={setCharCardData} setCharacterCardOpen={setCharCardOpen}></SearchArea>
            </div>



            <div className="flex flex-col gap-8 mt-22 min-w-0">

                {/* <div className="py-32 flex flex-col gap-4 items-center justify-center w-full font-sans">
                    <h1 className="text-4xl font-bold tracking-tight text-center">What character will you chat with?</h1>
                    <div className={`flex items-center justify-start gap-2 px-4 py-1 w-full sm:w-64 h-full rounded-full bg-white/5 border border-white/5`}>
                    <div className="flex items-center justify-center gap-2">
                            <SearchIcon className="opacity-80" />
                            <Input
                                // aref={searchInput}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                // onFocus={() => setSearchBarFocused(true)}
                                placeholder="Search"
                                className="bg-transparent border-0 flex-2 w-full ring-0! ring-offset-0!"
                            />
                            <Loader className={`absolute right-4 top-1/2 -translate-y-1/2 animate-spin transition-opacity ${searchLoading ? "opacity-50" : "opacity-0"}`} />
                        </div>
                    </div>
                </div> */}
                <div className="flex flex-col gap-2 w-full">
                    <p className="text-lg font-bold ml-6">Must-trys</p>

                    <CharacterCatalog characters={mustTryCharacters} onClick={handleCharacterClick} />
                </div>

                <div className="flex flex-col gap-2">
                    <p className="text-lg font-bold ml-6">Popular</p>
                    <CharacterCatalog characters={popularCharacters} onClick={handleCharacterClick} />

                </div>

                <div className="flex flex-col gap-2">
                    <p className="text-lg font-bold ml-6">These are cool</p>
                    <div className="flex gap-2 ml-6">
                        {TACtags.map((tag) => {
                            return (
                                <div className="p-2 px-3 bg-white/2 rounded-full text-xs text-white/50">{tag.replace("+", "")}</div>
                            )
                        })}
                    </div>
                    <div className="flex gap-2">
                        <CharacterCatalog characters={TACCharacters} layout="t" onClick={handleCharacterClick} />
                    </div>
                </div>

            </div>


            <CharacterCardDrawer charCardOpen={charCardOpen} setCharCardOpen={setCharCardOpen} charCardData={charCardData} />
            <p className="fixed bottom-0 right-0 m-4 opacity-10 text-xs">These characters are greatly served by <a className="underline" target="_blank" href="https://jannyai.com">JannyAI</a></p>

        </motion.div>
    )
}
