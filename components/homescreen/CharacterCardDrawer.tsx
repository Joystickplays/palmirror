import { useEffect, useState } from "react";
import { fetchCharacter, SearchResultItem } from "@/utils/searchUtils";
import { Drawer, DrawerContent } from "../ui/drawer";
import { usePMNotification } from "../notifications/PalMirrorNotification";
import { CharacterData } from "@/types/CharacterData";
import { Button } from "../ui/button";
import { ExternalLink, Loader, MessageCircle, MoreHorizontal, Pencil, X } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "../ui/popover";
import { useRouter } from "next/navigation";
import { useSidebarStore } from "@/context/zustandStore/Sidebar";
import React from "react";
import { motion } from "framer-motion";
import { AnimateChangeInHeight } from "../utilities/animate/AnimateHeight";


interface CharacterCardDrawerProps {
    charCardOpen: boolean;
    setCharCardOpen: (state: boolean) => void;
    charCardData?: SearchResultItem
}

export default function CharacterCardDrawer({ charCardOpen, setCharCardOpen, charCardData }: CharacterCardDrawerProps) {

    const setShowSetupCharacter = useSidebarStore(s => s.setShowSetupCharacter)

    const PMNotify = usePMNotification();
    const router = useRouter();

    const [resolving, setResolving] = useState(true);
    const [resolvedCharacter, setResolvedCharacter] = useState<CharacterData | undefined>(undefined);

    const [cloudflareBlocked, setCloudflareBlocked] = useState(false);

    useEffect(() => {
        (async () => {
            if (charCardOpen && charCardData) {
                try {
                    setCloudflareBlocked(false);
                    setResolving(true);
                    // await new Promise(resolve => setTimeout(resolve, 1000));
                    const resolved = await fetchCharacter(charCardData.provider, charCardData.id)

                    if (resolved) {
                        setResolvedCharacter(resolved)
                    }
                } catch (e: any) {
                    if (e.message.includes("Cloudflare blocked us")) {
                        PMNotify.error("JannyAI's Cloudflare is blocking your requests. You must manually download the character and import it.");
                        setCloudflareBlocked(true);
                        return;
                    }
                    PMNotify.error("Something went wrong while fetching character.")
                } finally {
                    setResolving(false);
                }

            }
        })();
    }, [charCardOpen])

    const startChat = () => {
        localStorage.setItem("characterData", JSON.stringify(resolvedCharacter));
        PMNotify.success("Character data saved! Starting chat...");

        setCharCardOpen(false);

        sessionStorage.removeItem("chatSelect");
        router.push("/chat");
    };


    return (<Drawer open={charCardOpen} onOpenChange={setCharCardOpen}>
        <DrawerContent>
            <div className="max-h-[90vh] overflow-y-auto hide-scrollbar relative font-sans">
                <img
                    style={{
                        maskImage: "linear-gradient(to bottom, black, rgba(0,0,0,0))"
                    }}
                    src={charCardData?.image}
                    className="h-108 w-full absolute top-2 left-0 object-cover object=[50%_30%] pointer-events-none " />
                <div className="pt-93 px-8 pb-20">
                    <h1 className="text-3xl font-black">{charCardData?.name}</h1>
                    <p className="opacity-50 text-sm mt-2">{charCardData?.description}</p>
                </div>


                <div className="fixed bottom-0 w-full bg-background border border-white/5 rounded-t-xl">
                    <AnimateChangeInHeight className="">
                        <div className="flex flex-col gap-2 p-3">

                            <div className=" flex gap-2 ">
                                <Button onClick={startChat} disabled={resolving || resolvedCharacter === undefined} className="flex-1">{(resolving) ? <Loader className="animate-spin" /> : <MessageCircle />}Start chat</Button>
                                <Popover>
                                    <PopoverTrigger>
                                        <Button variant={"outline"}><MoreHorizontal /></Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="flex flex-col gap-2 rounded-xl font-sans">
                                        <Button disabled={resolving || resolvedCharacter === undefined} onClick={() => {
                                            setShowSetupCharacter(true, resolvedCharacter)
                                            setCharCardOpen(false)
                                        }} className="justify-start" variant="outline"><Pencil />Edit</Button>
                                        <Button onClick={() => {
                                            window.open(charCardData?.charLink, "_blank")
                                        }} className="justify-start" variant="outline"><ExternalLink />Go to external page</Button>
                                    </PopoverContent>
                                </Popover>
                            </div>
                            {cloudflareBlocked &&
                                <motion.div
                                    initial={{ opacity: 0, y: 200 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        type: "spring", mass: 1, stiffness: 160, damping: 27
                                    }}
                                    className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-sm text-red-200">
                                    <div className="flex gap-1 uppercase font-bold items-center mb-2 text-xs">
                                        <X />
                                        Blocked
                                    </div>
                                    <p className="text-xs">JannyAI is using Cloudflare and it is aggressively <b>blocking ALL requests</b> that seem like they are coming from bots, which unfortunately includes our app.
                                        You can still access the character by clicking the "Go to external page" button and
                                        downloading the character file, then importing it into PalMirror.</p>
                                </motion.div>}
                        </div>
                    </AnimateChangeInHeight>
                </div>
            </div>
        </DrawerContent>
    </Drawer>);
}
