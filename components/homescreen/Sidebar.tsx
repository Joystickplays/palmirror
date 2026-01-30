"use client";

import { useContext, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useSidebarStore } from "@/context/zustandStore/Sidebar";
import { usePathname, useRouter } from "next/navigation";
import { usePMNotification } from "../notifications/PalMirrorNotification";
import SidebarButton from "./SidebarButton";
import { Button } from "../ui/button";
import { toast } from "react-toastify";

import pako from "pako";

import { CharacterData } from "@/types/CharacterData";

import { ChevronsLeft, Compass, Import, Menu, MessageCircle, PenLine, Plus, Settings } from "lucide-react";
import { isPalMirrorSecureActivated } from "@/utils/palMirrorSecureUtils";
import { PLMSecureContext } from "@/context/PLMSecureContext";
import SetupCharacter from "../modals/SetupCharacter";


export default function Sidebar() {
    const { isOpen, setOpen, showSetupCharacter, setShowSetupCharacter } = useSidebarStore();
    const pathname = usePathname();
    const PMNotify = usePMNotification();
    const router = useRouter();
    const PLMsecureContext = useContext(PLMSecureContext);

    const [activeTab, setActiveTab] = useState(pathname);


    const [showingCreate, setShowingCreate] = useState(false);


    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const importCharacter = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files![0];
        if (!file) {
            PMNotify.error("No file selected.");
            return;
        }

        const reader = new FileReader();

        toast.promise(
            new Promise<void>((resolve, reject) => {
                reader.onload = async function (event) {
                    try {
                        const fileContent = event.target?.result as ArrayBuffer;

                        const text = new TextDecoder().decode(fileContent);
                        const firstDelimiterIndex = text.indexOf("\n\n");
                        const delimiterIndex = text.indexOf(
                            "\n\n",
                            firstDelimiterIndex + 1
                        );
                        if (delimiterIndex === -1) {
                            reject(
                                new Error(
                                    "Invalid file format: unable to find the data delimiter."
                                )
                            );
                            return;
                        }

                        const compressedData = fileContent.slice(delimiterIndex + 2);
                        const compressedDataT = text.slice(delimiterIndex + 2);
                        const decompressedData = file.name
                            .split(".")
                            .slice(0, -1)
                            .join(".")
                            .includes("ucm")
                            ? compressedDataT
                            : pako.ungzip(new Uint8Array(compressedData), { to: "string" });
                        const characterData: CharacterData = JSON.parse(decompressedData);
                        if (characterData.plmex.domain?.active && !isPalMirrorSecureActivated()) {
                            PMNotify.info("Use PalMirror Secure for PalMirror Experience Domain characters!")
                            reject(
                                "Domain enabled character!"
                            )
                            return;
                        }

                        localStorage.setItem(
                            "characterData",
                            JSON.stringify(characterData)
                        );

                        if (characterData.plmex.domain?.active) {
                            const chatKey = crypto.randomUUID()
                            PLMsecureContext?.setSecureData(`METADATA${chatKey}`, {
                                ...characterData,
                                id: chatKey,
                                lastUpdated: new Date().toISOString(),
                            })
                            sessionStorage.setItem("chatSelect", chatKey)
                            router.push("/experience/domain")
                            return;
                        }
                        sessionStorage.removeItem("chatSelect");
                        router.push("/chat");

                        resolve();
                    } catch (err) {
                        reject(
                            new Error(
                                "Failed to import the character. Please check the file format."
                            )
                        );
                        console.error("Error while importing character:", err);
                    }
                };

                reader.readAsArrayBuffer(file);
            }),
            {
                pending: "Processing character file...",
                success: "Character imported successfully.",
                error: "Failed to import the character.",
            }
        );
    };

    useEffect(() => {
        setActiveTab(pathname);

        if (pathname === "/chat") {
            setOpen(false);
        }
    }, [pathname]);


    return (
        <>
            <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: isOpen ? 0 : '-100%' }}
                transition={{ type: "spring", stiffness: 160, damping: 20 }}
                className="flex flex-col items-center gap-2 fixed top-0 left-0 h-full bg-white/2 border border-white/5 text-white z-50 p-6 backdrop-blur-xl backdrop-brightness-50 backdrop-saturate-200"
            >

                <button onClick={() => setOpen(!isOpen)} className="absolute top-4 right-0 translate-x-[140%] p-2 rounded-md hover:bg-white/5 opacity-20 hover:opacity-90 transition-all">
                    {isOpen ? <ChevronsLeft size={32} /> : <Menu size={32} />}
                </button>

                <div
                    onMouseEnter={() => setOpen(true)}
                    className="absolute top-0 right-0 translate-x-full h-full w-4"></div>

                <img src="/palmirror.png" width={64} alt="logo" />
                <div className="w-full h-0.5 bg-white/5 mb-6"></div>

                <div className="relative w-full">
                    <motion.div
                        initial={{
                            height: "3.5rem",
                            width: "3.5rem",
                            borderRadius: '64px',
                            y: 0
                        }}
                        animate={
                            showingCreate ? {
                                x: Math.min(window.innerWidth * 0.07, 100),
                                height: '8rem',
                                width: '15rem',
                                borderRadius: '12px',
                                y: [0, 30, 0, 0, 0, 0, 0, 0, 0],
                            } : {
                                height: "3.5rem",
                                width: "3.5rem",
                                borderRadius: '64px',
                                y: 0
                            }
                        }

                        className="flex bg-[#1d1c1d] border border-white/5 absolute p-4 font-sans ml-1">
                        <motion.button
                            initial={{
                                top: '50%',
                                left: '50%',
                                x: '-50%',
                                y: '-50%',
                                opacity: 1
                            }}
                            animate={showingCreate ? {
                                top: '1%',
                                left: '100%',
                                x: '-100%',
                                y: '0%',
                                opacity: 0.5
                            } : {
                                top: '50%',
                                left: '50%',
                                x: '-50%',
                                y: '-50%',
                                opacity: 1
                            }}

                            whileTap={{
                                scale: 0.9
                            }}

                            className="absolute p-2"
                            onClick={(e) => {
                                setShowingCreate(!showingCreate)
                            }}
                        >
                            <motion.div
                                animate={showingCreate ? {
                                    rotate: '45deg'
                                } : {
                                    rotate: '0deg'
                                }}
                            >


                                <Plus className="text-white/80" size={32} />
                            </motion.div>
                        </motion.button>
                        <motion.div
                            initial={{
                                scale: 0,
                                opacity: 0
                            }}
                            animate={showingCreate ? {
                                scale: 1,
                                opacity: 1
                            } : {
                                scale: 0,
                                opacity: 0
                            }}
                            transition={
                                {
                                    type: 'spring',
                                    mass: 1,
                                    stiffness: 300,
                                    damping: 25
                                }
                            }
                            className="absolute origin-top-left flex flex-col gap-2 items-start"
                        >
                            <Button onClick={() => {
                                setShowSetupCharacter(true);
                                setShowingCreate(false);
                            }}><PenLine /> Setup Character</Button>
                            <SetupCharacter open={showSetupCharacter} changeOpen={(v: boolean) => setShowSetupCharacter(v)} onSetupComplete={() => {
                                setShowSetupCharacter(false);
                            }} />

                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={importCharacter}
                                style={{ display: 'none' }}
                                accept=".plmc"
                            />
                            <Button onClick={() => fileInputRef.current?.click()}><Import /> Import from file</Button>
                        </motion.div>
                    </motion.div>
                </div>

                <div className="flex flex-col gap-2 h-full justify-center">
                    <SidebarButton
                        path="/discover"
                        icon={<Compass />}
                        onClick={() => setActiveTab("/discover")}
                        isActive={activeTab === "/discover"}
                    />
                    <SidebarButton
                        path="/"
                        icon={<MessageCircle />}
                        onClick={() => setActiveTab("/")}
                        isActive={activeTab === "/"}
                    />
                    <SidebarButton
                        path="/settings"
                        icon={<Settings />}
                        onClick={() => setActiveTab("/settings")}
                        isActive={activeTab === "/settings"}
                    />
                </div>
            </motion.div>
        </>
    );
}