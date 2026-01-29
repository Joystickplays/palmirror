import { useEffect, useState } from "react";

import { Button } from "../ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "../ui/drawer";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

import { defaultCharacterData } from "@/types/CharacterData";
import { usePMNotification } from "../notifications/PalMirrorNotification";
import { useRouter } from "next/navigation";

interface SetupCharacterProps {
    open: boolean;
    changeOpen: (open: boolean) => void;
    onSetupComplete?: () => void;
}



export default function SetupCharacter({ open, changeOpen, onSetupComplete }: SetupCharacterProps) {

    const PMNotify = usePMNotification();
    const router = useRouter();

    const [characterData, setCharacterData] = useState(defaultCharacterData);

    const loadCharacterData = () => {
        const storedData = localStorage.getItem("characterData");
        if (storedData) {
            const parsedData = JSON.parse(storedData);
            const { image, plmex, ...rest } = parsedData;
            setCharacterData((prevData) => ({
                ...prevData,
                ...rest,
            }));
        }
    };

    const startChat = () => {
        if (
            !characterData.name ||
            !characterData.personality ||
            !characterData.initialMessage
        ) {
            PMNotify.error(
                "Please fill in all required fields (name, personality, first message)."
            );
            return;
        }

        setCharacterData((prevData) => {
            const updatedData = {
                ...prevData,
                image: "",
                plmex: defaultCharacterData.plmex,
            };
            localStorage.setItem("characterData", JSON.stringify(updatedData));
            PMNotify.success("Character data saved! Starting chat...");
            return updatedData;
        });

        onSetupComplete?.();

        sessionStorage.removeItem("chatSelect");
        router.push("/chat");
    };

    useEffect(() => {
        if (open) loadCharacterData();
    }, [open])

    return (<Drawer open={open} onOpenChange={changeOpen}>
        <DrawerContent className="w-auto max-w-[750px] min-w-[50vw] font-sans overflow-y-visible">
            <DrawerHeader>
                <DrawerTitle className="text-center text-2xl font-bold">Setup Character</DrawerTitle>
            </DrawerHeader>


            <div className="flex flex-col gap-4 my-4 px-4 overflow-y-scroll max-h-[70vh]">
                <div className="p-4 px-6 palmirror-exc w-full rounded-2xl mt-4 flex justify-between items-center">
                    <h1 className="palmirror-exc-text font-extrabold! text-xl">PalMirror Experience</h1>
                    <div className="flex items-center gap-2">
                        <p className="text-white/20 text-xs w-[200px] text-end">Memories, continuity, immersive worlds, and more.</p>
                        <Button onClick={() => {
                            router.push("/experience/create")
                            onSetupComplete?.();
                        }} variant={"palmirror"}>Create</Button>
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    <Label className="font-medium">Name</Label>
                    <Input value={characterData.name} onChange={(e) => setCharacterData({ ...characterData, name: e.target.value })} className="w-fit" />
                </div>

                <div className="flex flex-col gap-2">
                    <Label className="font-medium">Personality</Label>
                    <Textarea value={characterData.personality} onChange={(e) => setCharacterData({ ...characterData, personality: e.target.value })} placeholder="What traits this character has, specific details, how they talk, etc." rows={6} />
                </div>

                <div className="flex flex-col gap-2">
                    <Label className="font-medium">Initial message</Label>
                    <Textarea value={characterData.initialMessage} onChange={(e) => setCharacterData({ ...characterData, initialMessage: e.target.value })} placeholder="What the character says when first interacted with" rows={2} />
                </div>

                <Button onClick={startChat} className="mt-4 self-end">Start Character</Button>
            </div>
        </DrawerContent>
    </Drawer>)
}