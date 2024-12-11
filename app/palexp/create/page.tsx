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

export default function Home() {
    const router = useRouter();
    const [characterData, setCharacterData] = useState({
        image: "",
        name: "",
        personality: "",
        scenario: "",
        initialMessage: "",
        alternateInitialMessages: [] as string[]
    });

    const { name, personality, scenario, initialMessage, alternateInitialMessages } = characterData;

    const handleInputChange = (e: any) => {
        setCharacterData({ ...characterData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e: any) => {
        const target = e.target;
        const file = target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e: any) => {
                const base64String = e.target.result;
                setCharacterData({ ...characterData, image: base64String });
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="flex flex-col justify-content-center min-h-screen p-8 gap-4 font-[family-name:var(--font-geist-sans)]">
            <div className="flex justify-around items-center w-full !h-fit">
                <h1 className="scroll-m-20 text-2xl font-extrabold tracking-tight  pb-2 palmirror-exc-text w-full sm:w-auto text-center">
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
                    <div className="flex gap-2">
                        <img src={characterData.image !== "" ? characterData.image : undefined} alt="Character Picture" width={250} height={250} className={`rounded-full ${characterData.image ? 'block' : 'hidden'}`} />
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
                    {alternateInitialMessages.map((inMes, index) => (
                        <Card key={index}>
                            <CardContent className="p-4 flex flex-col gap-2">
                                <div className="flex justify-between gap-2">
                                    <h1>Greeting {index + 2}</h1>
                                    <Button variant="ghost" size="icon" onClick={() => {{
                        const newAlternateMessages = [...alternateInitialMessages];
                        newAlternateMessages.splice(index, 1);
                        setCharacterData({ ...characterData, alternateInitialMessages: newAlternateMessages });
                    }}}><Trash2 /></Button>
                                </div>
                                <Textarea id="initialMessage" name="initialMessage" value={inMes} onChange={(e) => {
                                    const newAlternateMessages = [...alternateInitialMessages];
                                    newAlternateMessages[index] = e.target.value;
                                    setCharacterData({ ...characterData, alternateInitialMessages: newAlternateMessages });
                                }} autoComplete="off" />

                            </CardContent>
                        </Card>
                    ))}
                    <Button onClick={() => {
                        setCharacterData({ ...characterData, alternateInitialMessages: [...alternateInitialMessages, ""] })
                    }}><CirclePlus />Add another</Button>
                </div>
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
