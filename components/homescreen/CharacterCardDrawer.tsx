import { useEffect, useState } from "react";
import { fetchCharacter, SearchResultItem } from "@/utils/searchUtils";
import { Drawer, DrawerContent } from "../ui/drawer";
import { usePMNotification } from "../notifications/PalMirrorNotification";
import { CharacterData } from "@/types/CharacterData";
import { Button } from "../ui/button";
import { ExternalLink, Loader, MessageCircle, MoreHorizontal, Pencil } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "../ui/popover";
import { useRouter } from "next/navigation";


interface CharacterCardDrawerProps {
    charCardOpen: boolean;
    setCharCardOpen: (state: boolean) => void;
    charCardData?: SearchResultItem
}

export default function CharacterCardDrawer({ charCardOpen, setCharCardOpen, charCardData }: CharacterCardDrawerProps) {

    const PMNotify = usePMNotification();
    const router = useRouter();

    const [resolving, setResolving] = useState(true);
    const [resolvedCharacter, setResolvedCharacter] = useState<CharacterData | undefined>(undefined);

    useEffect(() => {
        (async () => {
            if (charCardOpen && charCardData) {
                try {
                    setResolving(true);
                    const resolved = await fetchCharacter(charCardData.provider, charCardData.id)

                    if (resolved) {
                        setResolvedCharacter(resolved)
                    }
                } catch {
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


                <div className="fixed flex gap-2 bottom-0 w-full bg-background border border-white/5 rounded-t-xl p-3">
                    <Button onClick={startChat} disabled={resolving || resolvedCharacter === undefined} className="flex-1">{(resolving || resolvedCharacter === undefined) ? <Loader className="animate-spin" /> : <MessageCircle />}Start chat</Button>
                    <Popover>
                        <PopoverTrigger>
                            <Button variant={"outline"}><MoreHorizontal /></Button>
                        </PopoverTrigger>
                        <PopoverContent className="flex flex-col gap-2 rounded-xl font-sans">
                            <Button className="justify-start" variant="outline"><Pencil />Edit</Button>
                            <Button onClick={() => {
                                window.open(charCardData?.charLink, "_blank")
                            }} className="justify-start" variant="outline"><ExternalLink />Go to external page</Button>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
        </DrawerContent>
    </Drawer>);
}
