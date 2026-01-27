"use client";

import { Input } from "@/components/ui/input"
import { HorizontalScroll } from "@/components/utilities/HScroll";
import { useSidebarStore } from "@/context/zustandStore/Sidebar"
import { searchCharacters, SearchResultItem } from "@/utils/searchUtils";
import { motion } from "framer-motion"
import { Search } from "lucide-react"
import React, { useEffect, useState } from "react"


function CharacterCatalog({ characters, layout = 'l' }: { characters: SearchResultItem[], layout?: 'l' | 't' }) {
    return (<HorizontalScroll
        className="flex gap-2 overflow-x-auto w-full pb-2 hide-scrollbar px-6">
        {characters.length < 1 ? Array.from({ length: 20 }).map((_, idx) => {
            return (
                <div
                    key={idx}
                    style={{
                        animationDelay: `${idx * 100}ms`
                    }}
                    className={`${layout === "l" ? "w-64 h-32" : "w-45 h-64"} bg-white/5 rounded-xl animate-pulse shrink-0`}></div>
            )
        }) : characters.map((char, idx) => {
            return (
                <motion.button
                    initial={{
                        y: 20,
                        opacity: 0
                    }}
                    animate={{
                        y: 0,
                        opacity: 1,
                    }}
                    transition={{
                        type: 'spring',
                        mass: 1,
                        stiffness: 160,
                        damping: 20,
                        delay: idx * 0.05
                    }}
                    key={idx} className={`${layout === "l" ? "w-64 h-32 flex justify-end" : "w-45 h-64 flex flex-col justify-end"} text-start  p-2 py-3 bg-white/2 border border-white/5 rounded-xl overflow-hidden shrink-0 cursor-pointer relative`}>
                    {layout === "l" ? (
                        <>
                            <img className="absolute top-0 left-0 h-full w-32 object-cover object-[50%_30%] -z-1"
                                style={{
                                    maskImage: "linear-gradient(to right, black, rgba(0,0,0,0))"
                                }}
                                src={char.image} />
                            <div className="max-w-42">
                                <h1 className="whitespace-nowrap font-extrabold">{char.name}</h1>
                                <p className="text-xs opacity-50">{char.description && char.description.length > 50 ? char.description.slice(0, 50) + "..." : char.description}</p>
                            </div>
                        </>
                    ) : (
                        <>
                            <img className="absolute top-0 left-0 h-52 w-full object-cover object-[50%_30%] -z-1"
                                style={{
                                    maskImage: "linear-gradient(to bottom, black, rgba(0,0,0,0))"
                                }}
                                src={char.image} />
                            <h1 className="whitespace-nowrap font-extrabold">{char.name}</h1>
                            <p className="text-xs opacity-50 h-18">{char.description && char.description.length > 100 ? char.description.slice(0, 100) + "..." : char.description}</p>
                        </>
                    )}
                </motion.button>
            )
        })}
    </HorizontalScroll>)
}



export default function DiscoverPage() {

    const isOpen = useSidebarStore(s => s.isOpen)



    const [mustTryCharacters, setMustTryCharacters] = useState<SearchResultItem[]>([])
    const [popularCharacters, setPopularCharacters] = useState<SearchResultItem[]>([])
    const [TACCharacters, setTACCharacters] = useState<SearchResultItem[]>([])
    const [TACtags, setTACtags] = useState<string[]>([])

    useEffect(() => {
        (async () => {
            const result = await searchCharacters({
                provider: "janny.ai",
                query: "+Fluff +Game +AnyPOV +Fictional",
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
                excludeNsfw: false
            })

            setTACCharacters(result)
        })();
    }, [])


    return (
        <motion.div
            animate={{
                marginLeft: isOpen ? 100 : 0,
            }} className="flex min-h-screen p-6 px-0 gap-4 font-sans!">

            <div className="top-0 left-0 flex fixed justify-end mr-4 p-8 w-full z-10 pointer-events-none">
                <div className="flex items-center gap-2 p-1 px-4 bg-white/5 border border-white/5 rounded-full backdrop-blur-xl pointer-events-auto">
                    <Search />
                    <Input placeholder="Search" className="focus:ring-0! focus:ring-offset-0! bg-transparent border-0" />
                </div>
            </div>

            <div className="flex flex-col gap-8 mt-22 min-w-0">

                <div className="flex flex-col gap-2 w-full">
                    <p className="text-lg font-bold ml-6">Must-trys</p>

                    <CharacterCatalog characters={mustTryCharacters} />
                </div>

                <div className="flex flex-col gap-2">
                    <p className="text-lg font-bold ml-6">Popular</p>
                    <CharacterCatalog characters={popularCharacters} />

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
                        <CharacterCatalog characters={TACCharacters} layout="t" />
                    </div>
                </div>

            </div>

        </motion.div>
    )
}