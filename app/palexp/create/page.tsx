"use client"

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { useRouter } from 'next/navigation';
import { CirclePlus, Trash2 } from 'lucide-react';

import { AnimatePresence, motion } from "motion/react"
import NumberFlow from '@number-flow/react'

import pako from 'pako';


interface DynamicStatus {
    key: number;
    name: string;
    defaultValue: string;
}

interface AlternateInitialMessage {
    name: string;
    initialMessage: string;
}

interface CharacterData {
    image: string;
    name: string;
    personality: string;
    scenario: string;
    initialMessage: string;
    alternateInitialMessages: AlternateInitialMessage[];
    plmex: {
        dynamicStatuses: DynamicStatus[];
    };
}

export default function Home() {
    const router = useRouter();
    const [characterData, setCharacterData] = useState<CharacterData>({
        image: "",
        name: "",
        personality: "",
        scenario: "",
        initialMessage: "",
        alternateInitialMessages: [],
        plmex: {
            dynamicStatuses: []
        }
    });

    // const ButtonButMakeItMove = motion(Button);
    const { name, personality, scenario, initialMessage, alternateInitialMessages, plmex } = characterData;

    const requiredFields = [characterData.name, characterData.personality, characterData.initialMessage];

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setCharacterData({ ...characterData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const target = e.target;
        const file = target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e: ProgressEvent<FileReader>) => {
                if (e.target) {
                    const base64String = e.target.result as string;
                    setCharacterData({ ...characterData, image: base64String ?? "" });
                } else {
                    console.error("FileReader target is null");
                }
            };
            reader.readAsDataURL(file);
        }
    };

    // const CHUNK_SIZE = 65536;
    // const toBase64Batch = (data: Uint8Array): string => {
    //     let result = '';
    //     for (let i = 0; i < data.length; i += CHUNK_SIZE) {
    //         const chunk = data.slice(i, i + CHUNK_SIZE); 
    //         const binaryString = String.fromCharCode(...chunk);
    //         result += btoa(binaryString);
    //     }
    //     return result;
    // };
    
    
    const exportCharacter = () => {
        if (requiredFields.some(field => field.trim() === "")) {
            toast.error("Please fill in all required fields marked with the asterisk.");
            return;
        }
    
        const timestamp = new Date().toLocaleString();
        const credit = 
                       `// Born from the Experience. A spark only found here.\n` +
                       `// Handle with care. It remembers.\n\n` +
                       `// ${timestamp} at https://palm.goteamst.com\n\n`;
    
        const characterJSON = JSON.stringify(characterData, null, 2);
    
        const compressedData = pako.gzip(characterJSON, { level: 2 });
    
        const fileContent = new Uint8Array([...new TextEncoder().encode(credit), ...compressedData]);
        const blob = new Blob([fileContent], { type: 'application/octet-stream' });
    
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${characterData.name || "character"}.plmc`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    
        URL.revokeObjectURL(url);
    
        toast.success("Character downloaded to file.");
    };




    return (
        <div className="flex flex-col justify-center min-h-screen p-2 sm:p-8 gap-4 font-[family-name:var(--font-geist-sans)]">
            <div className="flex justify-around items-center w-full !h-fit">
                <h1 className="scroll-m-20 text-2xl font-extrabold tracking-tight mt-8 sm:mt-0 pb-2 palmirror-exc-text w-full sm:w-auto text-center">
                    PalMirror Experience
                </h1>
                <Button variant="outline" className="hidden sm:block" onClick={() => { router.push('/') }}>Back</Button>
            </div>
            <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight my-10  w-auto text-center">
                <i>Your</i> character, <span className="palmirror-exc-text">supercharged.</span>
            </h1>
            <div className="px-2 lg:px-48 flex flex-col gap-3">
                <p className="text-sm text-red-500">* Fields marked with asterisks are required.</p>
                <div className="flex flex-col gap-1">
                    <p>Character picture</p>
                    <div className="flex flex-col md:flex-row gap-2">
                        <img src={characterData.image !== "" ? characterData.image : undefined} alt="Character Picture" width={250} height={250} className={`rounded-full ${characterData.image ? 'block' : 'hidden'} size-40`} />
                        <Input id="picture" type="file" accept=".png, .jpg, .jpeg" onChange={handleImageChange} />
                    </div>
                </div>
                <div className="flex flex-col gap-1">
                    <Label htmlFor="name">Name <span className="text-sm text-red-500">*</span></Label>
                    <Input id="name" type="text" name="name" value={name} onChange={handleInputChange} autoComplete="off" />
                </div>
                <div className="flex flex-col gap-1">
                    <Label htmlFor="personality">Personality <span className="text-sm text-red-500">*</span></Label>
                    <Textarea id="personality" name="personality" value={personality} onChange={handleInputChange} autoComplete="off" />
                </div>
                <div className="flex flex-col gap-1">
                    <Label htmlFor="scenario">Scenario</Label>
                    <Input id="scenario" name="scenario" value={scenario} onChange={handleInputChange} autoComplete="off" />
                </div>
                <div className="flex flex-col gap-1">
                    <Label htmlFor="initialMessage">Initial message (Greeting) <span className="text-sm text-red-500">*</span></Label>
                    <Textarea id="initialMessage" name="initialMessage" value={initialMessage} onChange={handleInputChange} autoComplete="off" />
                    <AnimatePresence mode="popLayout">
                        {alternateInitialMessages.map((altMes, index) => (
                            <motion.div layout key={altMes.name}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                transition={{ type: "spring" }}>
                                <Card>
                                    <CardContent className="p-4 flex flex-col gap-2">
                                        <div className="flex justify-between gap-2">
                                            <h1>Greeting <NumberFlow value={index + 2}></NumberFlow></h1>
                                            <Button variant="ghost" size="icon" onClick={() => {
                                                const newAlternateMessages = alternateInitialMessages.filter((_, i) => i !== index);
                                                setCharacterData({ ...characterData, alternateInitialMessages: newAlternateMessages });
                                            }}><Trash2 /></Button>
                                        </div>
                                        <Textarea id={`altMessage-${index}`} name="initialMessage" value={altMes.initialMessage} onChange={(e) => {
                                            const newAlternateMessages = [...alternateInitialMessages];
                                            newAlternateMessages[index] = { ...altMes, initialMessage: e.target.value };
                                            setCharacterData({ ...characterData, alternateInitialMessages: newAlternateMessages });
                                        }} autoComplete="off" />

                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    <Button variant="outline" onClick={() => {
                        setCharacterData({ ...characterData, alternateInitialMessages: [...alternateInitialMessages, { name: `Greeting ${Math.floor(Math.random() * 27631337)}`, initialMessage: "" }] })
                    }}><CirclePlus />Add another</Button>
                </div>
                <div className="flex flex-col gap-1">
                    <div className="flex flex-col gap-5 border rounded-lg palmirror-exc p-8"> {/* all glowy because r u kidding?? this is palmirror experience!! */}
                        <div className="flex flex-col gap-1">
                            <h1 className="palmirror-exc-text text-2xl">Dynamic Statuses</h1>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <AnimatePresence mode="popLayout">
                                    {plmex.dynamicStatuses.map((dynStat, index) => (
                                        <motion.div layout key={dynStat.key}
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0.8, opacity: 0 }}
                                            transition={{ type: "spring", stiffness: 225, damping: 30 }}>
                                            <Card>
                                                <CardContent className="p-4 flex flex-col xl:flex-row gap-2">
                                                    <div className="flex-1">
                                                        <Input id={`dynStatName-${index}`} type="text" name="name" value={dynStat.name} onChange={(e) => {
                                                            const newDynStatuses = [...plmex.dynamicStatuses];
                                                            newDynStatuses[index] = { ...dynStat, name: e.target.value };
                                                            setCharacterData({ ...characterData, plmex: { ...plmex, dynamicStatuses: newDynStatuses } });
                                                        }} autoComplete="off" placeholder="Status Name" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <Input id={`dynStatDefaultValue-${index}`} type="text" name="defaultValue" value={dynStat.defaultValue} onChange={(e) => {
                                                            const newDynStatuses = [...plmex.dynamicStatuses];
                                                            newDynStatuses[index] = { ...dynStat, defaultValue: e.target.value };
                                                            setCharacterData({ ...characterData, plmex: { ...plmex, dynamicStatuses: newDynStatuses } });
                                                        }} autoComplete="off" placeholder="Default Value" />
                                                    </div>
                                                    <Button variant="ghost" size="icon" onClick={() => {
                                                        const newDynStatuses = plmex.dynamicStatuses.filter((_, i) => i !== index);
                                                        setCharacterData({ ...characterData, plmex: { ...plmex, dynamicStatuses: newDynStatuses } });
                                                    }}><Trash2 /></Button>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    ))}


                                </AnimatePresence>

                            </div>
                            <Button key="ADDBUTTON" size="sm" variant="outline" onClick={() => {
                                if (plmex.dynamicStatuses.length < 5) {
                                    setCharacterData({ ...characterData, plmex: { ...plmex, dynamicStatuses: [...plmex.dynamicStatuses, { key: Math.floor(Math.random() * 69420), name: "", defaultValue: "" }] } })

                                } else {
                                    toast.error("Do you really need more than 5?")
                                }
                            }}><CirclePlus /> Add</Button>
                        </div>
                        <div className="flex flex-col gap-1">
                            <h1 className="palmirror-exc-text text-2xl">Invocations</h1>
                            <Button key="ADDBUTTON" size="sm" variant="outline" onClick={() => {

                            }}><CirclePlus /> Add</Button>
                        </div>
                    </div>
                </div>
                <Button onClick={exportCharacter} className="mt-5 transition-transform hover:scale-105 transform-gpu" variant="palmirror">Export character</Button>
            </div>
            <ToastContainer
                position="top-right"
                autoClose={5000}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                theme="dark"
            />
        </div>
    );
}
