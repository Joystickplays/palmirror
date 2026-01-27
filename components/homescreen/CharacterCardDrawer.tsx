import { useState } from "react";
import { SearchResultItem } from "@/utils/searchUtils";
import { Drawer, DrawerContent } from "../ui/drawer";


interface CharacterCardDrawerProps {
    charCardOpen: boolean;
    setCharCardOpen: (state: boolean) => void;
    charCardData?: SearchResultItem
}

export default function CharacterCardDrawer({ charCardOpen, setCharCardOpen, charCardData } : CharacterCardDrawerProps) {
    
    const [resolvedCharacter, setResolvedCharacter] = useState<CharacterData | undefined>(undefined);

    
    return (<Drawer open={charCardOpen} onOpenChange={setCharCardOpen}>
        <DrawerContent>
            <div className="max-h-[80vh] overflow-y-auto hide-scrollbar relative font-sans">
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
            </div>
        </DrawerContent>
    </Drawer>);
}
