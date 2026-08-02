"use client"

import React, { useState, useEffect, useContext, useRef } from "react";
import { AnimatePresence, motion } from 'motion/react';
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { ToastContainer } from "react-toastify";
import { ArrowLeft, ArrowRight, Check, Loader2, Sparkles, Earth, Users, Package, BookOpen, Wand2 } from 'lucide-react';

import { PLMSecureContext } from "@/context/PLMSecureContext";
import { usePMNotification } from "@/components/notifications/PalMirrorNotification";

import { CharacterData, defaultCharacterData } from "@/types/CharacterData";
import { WorldCharacter, WorldObject } from "@/types/EEDomain";

import WorldCharacterItem from "@/components/domains/WorldCharacterItem";
import WorldObjectItem from "@/components/domains/WorldObjectItem";

import { AnimateChangeInHeight } from "@/components/utilities/animate/AnimateHeight";

import { independentInitOpenAI, generateChatCompletion } from "@/utils/portableAi";
import { worldPremiseSysInst } from "@/utils/domainInstructionShaping/worldPremiseSysInst";
import { worldNarratorGenSysInst } from "@/utils/domainInstructionShaping/worldNarratorGenSysInst";
import { setWorldUserCharacterExclusive } from "@/utils/domainData";

interface ScenarioGenre {
    genre: string;
    icon: string;
    scenarios: Array<{ title: string; premise: string }>;
}

const scenarioGenres: ScenarioGenre[] = [
    {
        genre: "Fantasy",
        icon: "🐉",
        scenarios: [
            { title: "The Shattered Crown", premise: "A kingdom divided after its royal line was wiped out; magic is draining from the land and each faction blames the others." },
            { title: "The Last Lighthouse", premise: "Civilization lives inside vast protective beacons. The southernmost lighthouse is failing, and whatever it keeps out is getting restless." },
        ],
    },
    {
        genre: "Slice of Life",
        icon: "🍵",
        scenarios: [
            { title: "The Corner Bookshop", premise: "A small, cozy bookshop and café in a quiet town where regulars, strays, and slow seasons shape a gentle daily rhythm." },
            { title: "Seaside Boarding House", premise: "An old seaside boarding house run by a scatterbrained matriarch, hosting a rotating cast of peculiar long-term guests." },
        ],
    },
    {
        genre: "Medieval",
        icon: "⚔️",
        scenarios: [
            { title: "The Winter Court", premise: "A northern barony entering a brutal winter with dwindling stores, feuding houses, and rumors of a return of an old enemy." },
            { title: "The Iron Monastery", premise: "A fortified monastery that both protects and imprisons, guarding a secret the church would kill to keep buried." },
        ],
    },
    {
        genre: "Sci-Fi",
        icon: "🚀",
        scenarios: [
            { title: "The Generation Ship", premise: "A generation ship 200 years into its voyage, where the original mission is a myth and the decks have become warring nations." },
            { title: "Dead Signal", premise: "A frontier colony that lost contact with Earth. The relays still pulse — but the messages stopped coming from somewhere that isn't home." },
        ],
    },
    {
        genre: "Horror",
        icon: "🕯️",
        scenarios: [
            { title: "The House That Breathes", premise: "A remote village where the forest moves at night, and the house at the edge of town keeps offering rooms to people who never leave." },
            { title: "The Frequency", premise: "After the town's radio tower began broadcasting backwards static, the people started hearing their own thoughts echoed back a second too late." },
        ],
    },
    {
        genre: "Romance",
        icon: "🌹",
        scenarios: [
            { title: "The Slow Season", premise: "Two rival families run competing orchards on opposite sides of the valley, and a long, lazy harvest season forces them together." },
            { title: "Letters Unsent", premise: "A melancholy mail sorter in a sleepy town keeps finding letters addressed to no one — and one of them is signed by someone they know." },
        ],
    },
    {
        genre: "Mystery",
        icon: "🕵️",
        scenarios: [
            { title: "The Ten O'Clock Train", premise: "Every night at ten, a train no one boarded passes through the station. The townspeople pretend not to see it — until a body is found in its last car." },
            { title: "The Archivist", premise: "An archivist in a city library discovers records of events that never happened, all signed by a clerk who never existed." },
        ],
    },
    {
        genre: "Adventure",
        icon: "🧭",
        scenarios: [
            { title: "The Uncharted Archipelago", premise: "A chain of islands that shifts its own geography, home to lost expeditions, sunken fleets, and a prize every cartographer would die for." },
            { title: "The Long Road", premise: "An ancient trade road crosses a continent of ruin. Every mile has a story, every inn a debt, and every traveler a reason for the road." },
        ],
    },
    {
        genre: "Post-Apocalyptic",
        icon: "🏜️",
        scenarios: [
            { title: "The Last Irrigation", premise: "One functioning waterworks sustains a fragile settlement. The machine is failing, and the desert clans have started to circle." },
            { title: "The Signal Repeaters", premise: "Survivors maintain a chain of radio repeaters across the wasteland. Someone has been relaying a broadcast that isn't theirs — and it's counting down." },
        ],
    },
    {
        genre: "Urban",
        icon: "🌆",
        scenarios: [
            { title: "The Midnight Shift", premise: "A 24-hour diner in a sleepless city where the overnight regulars each carry a story heavier than the plates they leave behind." },
            { title: "The Glass Tower", premise: "An ambitious young hire joins a corporation that never sleeps, only to realize the building's real business happens after dark." },
        ],
    },
    {
        genre: "Cyberpunk",
        icon: "🌃",
        scenarios: [
            { title: "The Undercity Server", premise: "Beneath a gleaming megacity, a community runs the last free server. The corps have started sending 'maintenance' crews." },
            { title: "Chrome and Rain", premise: "In a city where memories are currency, a fixer deals in lost identity — until a client asks to buy back their own past." },
        ],
    },
    {
        genre: "Supernatural",
        icon: "👁️",
        scenarios: [
            { title: "The Between", premise: "A motel on the highway sits at a fold between worlds. Ghosts check in, gods pass through, and the night clerk knows everyone's true name." },
            { title: "The Garden of Echoes", premise: "A village garden grows memories instead of flowers. For generations the townsfolk have tended it — and quietly buried what they plant." },
        ],
    },
];

const STEPS = [
    { label: "Welcome", icon: Earth },
    { label: "Identity", icon: Wand2 },
    { label: "Premise", icon: BookOpen },
    { label: "Cast", icon: Users },
    { label: "Objects", icon: Package },
    { label: "Story drive", icon: Sparkles },
    { label: "Narrator", icon: Sparkles },
    { label: "Review", icon: Check },
] as const;

const WorldCreatePage: React.FC = () => {
    const router = useRouter();
    const PMNotify = usePMNotification();
    const PLMsecureContext = useContext(PLMSecureContext);

    const [step, setStep] = useState(0);
    const [configHighend, setConfigHighend] = useState(false);

    const [worldName, setWorldName] = useState("");
    const [worldImage, setWorldImage] = useState("");
    const [premise, setPremise] = useState("");
    const [premiseScratch, setPremiseScratch] = useState("");
    const [premiseGenerating, setPremiseGenerating] = useState(false);
    const [premiseResult, setPremiseResult] = useState("");
    const [premiseReasoning, setPremiseReasoning] = useState("");
    const [premiseReasoningFinish, setPremiseReasoningFinish] = useState(false);
    const [showPremiseResult, setShowPremiseResult] = useState(false);
    const [showPremiseReasoning, setShowPremiseReasoning] = useState(true);

    const [worldCharacters, setWorldCharacters] = useState<WorldCharacter[]>([]);
    const [worldObjects, setWorldObjects] = useState<WorldObject[]>([]);

    const [narrativeMode, setNarrativeMode] = useState<"reactive" | "proactive">("reactive");

    const [narratorPersona, setNarratorPersona] = useState("");
    const [narratorGenerating, setNarratorGenerating] = useState(false);
    const [narratorResult, setNarratorResult] = useState("");
    const [narratorReasoning, setNarratorReasoning] = useState("");
    const [narratorReasoningFinish, setNarratorReasoningFinish] = useState(false);
    const [showNarratorResult, setShowNarratorResult] = useState(false);
    const [showNarratorReasoning, setShowNarratorReasoning] = useState(true);

    const [creating, setCreating] = useState(false);
    const [expandedGenre, setExpandedGenre] = useState<string | null>(null);

    const premiseScrollRef = useRef<HTMLDivElement>(null);
    const narratorScrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setConfigHighend(!!localStorage.getItem("PLMGlobalConfig") ? (JSON.parse(localStorage.getItem("PLMGlobalConfig")!).highend === true) : false);
        (async () => {
            await independentInitOpenAI()
        })();
    }, []);

    useEffect(() => {
        if (premiseScrollRef.current) {
            premiseScrollRef.current.scrollTop = premiseScrollRef.current.scrollHeight;
        }
    }, [premiseReasoning]);

    useEffect(() => {
        if (narratorScrollRef.current) {
            narratorScrollRef.current.scrollTop = narratorScrollRef.current.scrollHeight;
        }
    }, [narratorReasoning]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setWorldImage((ev.target?.result as string) ?? "");
            };
            reader.readAsDataURL(file);
        }
    };

    const generatePremise = () => {
        if (premiseScratch.trim() === "") {
            PMNotify.error("Please describe your world in a few words first.");
            return;
        }

        (async () => {
            try {
                let modelName = "gpt-3.5-turbo"
                const settings = localStorage.getItem("Proxy_settings");
                if (settings) {
                    const settingsParse = JSON.parse(settings)
                    modelName = settingsParse.modelName
                }

                setPremiseResult("");
                setPremiseReasoning("");
                setPremiseReasoningFinish(false);
                setShowPremiseReasoning(true);
                setShowPremiseResult(true);
                setPremiseGenerating(true);

                const responseStream = generateChatCompletion({
                    model: modelName,
                    temperature: 0.8,
                    stream: true,
                    messages: [{
                        role: "system",
                        content: worldPremiseSysInst.trim()
                    }, {
                        role: "user",
                        content: premiseScratch.trim()
                    }]
                });

                let accumulatedText = "";
                let accumulatedReasoning = "";
                for await (const chunk of responseStream) {
                    const content = chunk.choices?.[0]?.delta?.content || "";
                    accumulatedText += content;
                    if (accumulatedText !== "" && !premiseReasoningFinish) {
                        setPremiseReasoningFinish(true);
                        setShowPremiseReasoning(false);
                    }
                    setPremiseResult(accumulatedText);

                    let c_reason = chunk.choices?.[0]?.delta?.reasoning_content?.[0]?.thinking || "";
                    if (c_reason === "") {
                        c_reason = chunk.choices?.[0]?.delta?.reasoning_content || chunk.choices?.[0]?.delta?.reasoning || "";
                    }
                    if (c_reason) {
                        accumulatedReasoning += c_reason;
                        setPremiseReasoning(accumulatedReasoning);
                    }
                }
                setPremiseGenerating(false);
            } catch (e) {
                console.error("Error generating world premise:", e);
                PMNotify.error(`Failed to generate world premise. Please try again.`);
                setPremiseGenerating(false);
                setShowPremiseResult(false);
            }
        })();
    };

    const useGeneratedPremise = () => {
        if (premiseResult.trim() === "") {
            PMNotify.error("No generated premise to use.");
            return;
        }
        setPremise(premiseResult.trim());
        setShowPremiseResult(false);
        PMNotify.success("Premise set!");
    };

    const generateNarrator = () => {
        (async () => {
            try {
                let modelName = "gpt-3.5-turbo"
                const settings = localStorage.getItem("Proxy_settings");
                if (settings) {
                    const settingsParse = JSON.parse(settings)
                    modelName = settingsParse.modelName
                }

                const sysInst = worldNarratorGenSysInst({
                    worldName,
                    premise,
                    castNames: worldCharacters.map(c => c.name).filter(n => n.trim() !== ""),
                    narrativeMode,
                });

                setNarratorResult("");
                setNarratorReasoning("");
                setNarratorReasoningFinish(false);
                setShowNarratorReasoning(true);
                setShowNarratorResult(true);
                setNarratorGenerating(true);

                const responseStream = generateChatCompletion({
                    model: modelName,
                    temperature: 0.8,
                    stream: true,
                    messages: [{
                        role: "system",
                        content: sysInst.trim()
                    }, {
                        role: "user",
                        content: "Generate the narrator persona for this world."
                    }]
                });

                let accumulatedText = "";
                let accumulatedReasoning = "";
                for await (const chunk of responseStream) {
                    const content = chunk.choices?.[0]?.delta?.content || "";
                    accumulatedText += content;
                    if (accumulatedText !== "" && !narratorReasoningFinish) {
                        setNarratorReasoningFinish(true);
                        setShowNarratorReasoning(false);
                    }
                    setNarratorResult(accumulatedText);

                    let c_reason = chunk.choices?.[0]?.delta?.reasoning_content?.[0]?.thinking || "";
                    if (c_reason === "") {
                        c_reason = chunk.choices?.[0]?.delta?.reasoning_content || chunk.choices?.[0]?.delta?.reasoning || "";
                    }
                    if (c_reason) {
                        accumulatedReasoning += c_reason;
                        setNarratorReasoning(accumulatedReasoning);
                    }
                }
                setNarratorGenerating(false);
            } catch (e) {
                console.error("Error generating narrator persona:", e);
                PMNotify.error(`Failed to generate narrator persona. Please try again.`);
                setNarratorGenerating(false);
                setShowNarratorResult(false);
            }
        })();
    };

    const useGeneratedNarrator = () => {
        if (narratorResult.trim() === "") {
            PMNotify.error("No generated narrator persona to use.");
            return;
        }
        setNarratorPersona(narratorResult.trim());
        setShowNarratorResult(false);
        PMNotify.success("Narrator persona set!");
    };

    const createWorld = async () => {
        if (worldName.trim() === "") {
            PMNotify.error("Give your world a name.");
            setStep(1);
            return;
        }
        if (premise.trim() === "") {
            PMNotify.error("Your world needs a premise.");
            setStep(2);
            return;
        }

        setCreating(true);

        try {
            const chatKey = crypto.randomUUID();
            const newWorld: CharacterData = {
                ...defaultCharacterData,
                name: worldName.trim(),
                image: worldImage,
                scenario: premise.trim(),
                plmex: {
                    domain: {
                        ...defaultCharacterData.plmex.domain!,
                        active: true,
                        worldType: "world",
                        worldConfig: {
                            narratorPersona,
                            narrativeMode,
                            characters: worldCharacters,
                            objects: worldObjects,
                        },
                    },
                    dynamicStatuses: [],
                    invocations: [],
                },
            };

            await PLMsecureContext?.setSecureData(`METADATA${chatKey}`, {
                ...newWorld,
                id: chatKey,
                lastUpdated: new Date().toISOString(),
            });

            sessionStorage.setItem("chatSelect", chatKey);
            PMNotify.success("World created!");
            router.push("/experience/domain");
        } catch (e) {
            console.error("Failed to create world:", e);
            PMNotify.error("Failed to create world. Please try again.");
            setCreating(false);
        }
    };

    const canProceed = () => {
        switch (step) {
            case 1: return worldName.trim() !== "";
            case 2: return premise.trim() !== "";
            case 3: return true;
            case 4: return true;
            case 5: return true;
            case 6: return narratorPersona.trim() !== "";
            default: return true;
        }
    };

    const next = () => {
        if (!canProceed()) {
            PMNotify.error(step === 1 ? "Name your world first." : step === 2 ? "Write or generate a premise first." : step === 6 ? "Generate or write a narrator persona first." : "Complete this step first.");
            return;
        }
        setStep((s) => Math.min(s + 1, STEPS.length - 1));
    };

    const back = () => setStep((s) => Math.max(s - 1, 0));

    return (
        <div className="flex flex-col min-h-screen p-4 sm:p-8 font-sans">
            <div className="flex items-center gap-3 w-full max-w-4xl mx-auto pb-6">
                <Button variant="outline" onClick={() => router.push("/")}><ArrowLeft /></Button>
                <div className="flex-1 flex items-center gap-1">
                    {STEPS.map((s, i) => (
                        <motion.div
                            key={s.label}
                            className={`h-1 flex-1 rounded-full transition-colors duration-1000  ${i <= step ? "bg-primary" : "bg-white/10"}`}
                            initial={false}
                        />
                    ))}
                </div>
                <p className="text-xs opacity-50 whitespace-nowrap">{step + 1} / {STEPS.length}</p>
            </div>

            <div className="w-full max-w-4xl mx-auto flex-1 flex flex-col">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step}
                        initial={{ opacity: 0, x: 60 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -60 }}
                        transition={{ type: 'spring', mass: 1, stiffness: 160, damping: 20 }}
                        className="flex flex-col gap-6 flex-1"
                    >
                        {step === 0 && (
                            <div className="flex flex-col gap-8 items-center text-center flex-1 justify-center">
                                <motion.div
                                    initial={configHighend ? { opacity: 0, scale: 0.8, y: -60 } : { opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    transition={{ type: 'spring', mass: 1, stiffness: 100, damping: 16 }}
                                    className="palmirror-exc border border-white/20 rounded-3xl w-full p-8 py-12 flex flex-col gap-4 items-center"
                                >
                                    <h1 className="text-4xl font-extrabold palmirror-exc-text">Create a Domain World</h1>
                                    <p className="text-sm opacity-70 max-w-lg">
                                        A World is a persistent, multi-character story space. One premise, one narrator, endless chapters. Explore the kinds of worlds you can build below — pick a genre for inspiration, then craft your own.
                                    </p>
                                </motion.div>

                                <div className="w-full flex flex-col gap-3">
                                    <h2 className="font-bold text-lg text-start">What kind of world do you have in mind?</h2>
                                    <AnimatePresence mode="wait">
                                        {expandedGenre && (
                                            <motion.div
                                                key={expandedGenre}
                                                initial={{ opacity: 0, y: -10, height: 0 }}
                                                animate={{ opacity: 1, y: 0, height: "auto" }}
                                                exit={{ opacity: 0, y: -10, height: 0 }}
                                                transition={{ type: 'spring', mass: 1, stiffness: 160, damping: 20 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="flex flex-col gap-2 p-4 border border-white/10 rounded-xl bg-white/5">
                                                    {scenarioGenres.filter((g) => g.genre === expandedGenre).map((g) => (
                                                        <React.Fragment key={g.genre}>
                                                            <p className="text-sm font-bold flex items-center gap-2"><span>{g.icon}</span>{g.genre} — examples</p>
                                                            {g.scenarios.map((s) => (
                                                                <div key={s.title} className="flex flex-col gap-1">
                                                                    <p className="text-xs font-bold opacity-80">{s.title}</p>
                                                                    <p className="text-xs opacity-60">{s.premise}</p>
                                                                </div>
                                                            ))}
                                                        </React.Fragment>
                                                    ))}
                                                    <p className="text-[10px] opacity-40 italic">Reference only — you'll craft your own premise next.</p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 w-full">
                                        {scenarioGenres.map((g, idx) => (
                                            <motion.div
                                                key={g.genre}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ type: 'spring', mass: 1, stiffness: 161, damping: 12, delay: (idx * 0.04) + 0.1 }}
                                            >
                                                <Button
                                                    variant={expandedGenre === g.genre ? "default" : "outline"}
                                                    className="w-full justify-start!"
                                                    onClick={() => setExpandedGenre(expandedGenre === g.genre ? null : g.genre)}
                                                >
                                                    <span className="mr-2">{g.icon}</span>{g.genre}
                                                </Button>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 1 && (
                            <div className="flex flex-col gap-6 flex-1 justify-center">
                                <h1 className="text-3xl font-extrabold">Name your world</h1>
                                <p className="text-sm opacity-70">This is the world you'll be entering — give it an identity.</p>
                                <div className="flex flex-col gap-4">
                                    <div className="flex flex-col gap-2">
                                        <Label>World picture</Label>
                                        <div className="flex flex-col md:flex-row gap-2 items-center">
                                            {worldImage && <img src={worldImage} alt="World picture" className="size-40 rounded-2xl object-cover" />}
                                            <Input type="file" accept=".png, .jpg, .jpeg" onChange={handleImageChange} />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="worldName">World name <span className="text-red-500">*</span></Label>
                                        <Input id="worldName" type="text" value={worldName} onChange={(e) => setWorldName(e.target.value)} autoComplete="off" placeholder="e.g. The Wizarding World" autoFocus />
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="flex flex-col gap-6 flex-1 justify-center">
                                <h1 className="text-3xl font-extrabold">World premise</h1>
                                <p className="text-sm opacity-70 whitespace-pre-line">
                                    {`This premise applies to every chapter in the world. Make it foundational — a setting the story keeps returning to, not a one-off scene.\n\nDescribe your world in a few words and let the AI expand it into a long-lasting premise, or write it yourself.`}
                                </p>

                                <div className="flex flex-col gap-3">
                                    <AnimateChangeInHeight className="palmirror-exc rounded-2xl">
                                        <div className="p-4 px-6 flex flex-col gap-3">
                                            <h2 className="font-bold text-lg">Generate a premise</h2>
                                            <Textarea placeholder="e.g. A kingdom on the brink of civil war where magic is fading..." value={premiseScratch} onChange={(e) => setPremiseScratch(e.target.value)} />
                                            <div className="flex gap-2">
                                                <Button onClick={generatePremise} disabled={premiseGenerating}>
                                                    {premiseGenerating ? <Loader2 className="animate-spin" /> : <Sparkles />} {premiseGenerating ? "Generating..." : "Generate premise"}
                                                </Button>
                                                {premiseResult && <Button variant="outline" onClick={useGeneratedPremise}><Check /> Use this</Button>}
                                            </div>

                                            {showPremiseResult && (
                                                <div className="flex flex-col gap-2">
                                                    {premiseReasoning && showPremiseReasoning && (
                                                        <div className="border border-white/10 rounded-xl p-4 flex flex-col gap-2">
                                                            <h2 className="font-bold opacity-50 italic tracking-widest text-sm w-full text-end">Thinking</h2>
                                                            <div ref={premiseScrollRef} className="max-h-40 text-xs opacity-50 overflow-y-auto whitespace-pre-wrap">{premiseReasoning}</div>
                                                        </div>
                                                    )}
                                                    <div className="border border-white/10 rounded-xl p-4 min-h-24 whitespace-pre-wrap text-sm">{premiseResult}</div>
                                                </div>
                                            )}
                                        </div>
                                    </AnimateChangeInHeight>

                                    <div className="flex flex-col gap-2">
                                        <Label htmlFor="premise">Your premise <span className="text-red-500">*</span></Label>
                                        <Textarea id="premise" rows={8} value={premise} onChange={(e) => setPremise(e.target.value)} placeholder="Write your world's foundational premise here..." />
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="flex flex-col gap-6 flex-1 justify-center">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h1 className="text-3xl font-extrabold">The cast</h1>
                                        <p className="text-sm opacity-70">Characters that live in this world. The narrator controls all of them. You can add more anytime.</p>
                                    </div>
                                    <Button variant="ghost" onClick={next}>Skip for now <ArrowRight /></Button>
                                </div>
                                <div className="flex flex-col gap-4">
                                    <AnimatePresence mode="popLayout">
                                        {worldCharacters.map((wc, idx) => (
                                            <WorldCharacterItem
                                                key={wc.id}
                                                character={wc}
                                                characterNames={worldCharacters.map((c) => c.name)}
                                                onUpdate={(updated) => {
                                                    const newChars = setWorldUserCharacterExclusive(
                                                        worldCharacters.map((c, i) => (i === idx ? updated : c)),
                                                        updated.id,
                                                        !!updated.isUser,
                                                    );
                                                    setWorldCharacters(newChars);
                                                }}
                                                onDelete={() => {
                                                    const newChars = worldCharacters.filter((_, i) => i !== idx);
                                                    setWorldCharacters(newChars);
                                                }}
                                            />
                                        ))}
                                    </AnimatePresence>
                                    <Button variant="outline" onClick={() => {
                                        const newChar: WorldCharacter = {
                                            id: crypto.randomUUID(),
                                            name: "",
                                            personality: "",
                                            attributes: [],
                                        };
                                        setWorldCharacters([...worldCharacters, newChar]);
                                    }}>+ Add Character</Button>
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="flex flex-col gap-6 flex-1 justify-center">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h1 className="text-3xl font-extrabold">Objects</h1>
                                        <p className="text-sm opacity-70">Things that exist in this world — with optional visuals the AI can see and custom actions the user can attach.</p>
                                    </div>
                                    <Button variant="ghost" onClick={next}>Skip for now <ArrowRight /></Button>
                                </div>
                                <div className="flex flex-col gap-4">
                                    <AnimatePresence mode="popLayout">
                                        {worldObjects.map((wo, idx) => (
                                            <WorldObjectItem
                                                key={wo.id}
                                                object={wo}
                                                onUpdate={(updated) => {
                                                    const newObjects = [...worldObjects];
                                                    newObjects[idx] = updated;
                                                    setWorldObjects(newObjects);
                                                }}
                                                onDelete={() => {
                                                    const newObjects = worldObjects.filter((_, i) => i !== idx);
                                                    setWorldObjects(newObjects);
                                                }}
                                            />
                                        ))}
                                    </AnimatePresence>
                                    <Button variant="outline" onClick={() => {
                                        const newObj: WorldObject = {
                                            id: crypto.randomUUID(),
                                            name: "",
                                            description: "",
                                            actions: [],
                                        };
                                        setWorldObjects([...worldObjects, newObj]);
                                    }}>+ Add Object</Button>
                                </div>
                            </div>
                        )}

                        {step === 5 && (
                            <div className="flex flex-col gap-6 flex-1 justify-center">
                                <h1 className="text-3xl font-extrabold">Story drive</h1>
                                <p className="text-sm opacity-70">How much should the narrator push the story forward on its own?</p>
                                <div className="flex flex-col gap-3">
                                    <Button
                                        variant={narrativeMode === "reactive" ? "default" : "outline"}
                                        className="justify-start! h-auto p-5"
                                        onClick={() => setNarrativeMode("reactive")}
                                    >
                                        <div className="flex flex-col gap-1 text-start">
                                            <span className="font-bold text-base">Reactive</span>
                                            <span className="text-xs opacity-70">The narrator advances the scene but lets you set the pace. Classic roleplay feel.</span>
                                        </div>
                                    </Button>
                                    <Button
                                        variant={narrativeMode === "proactive" ? "default" : "outline"}
                                        className="justify-start! h-auto p-5"
                                        onClick={() => setNarrativeMode("proactive")}
                                    >
                                        <div className="flex flex-col gap-1 text-start">
                                            <span className="font-bold text-base">Proactive</span>
                                            <span className="text-xs opacity-70">The narrator drives the plot on its own — introducing complications and events without waiting. AI Dungeon-style.</span>
                                        </div>
                                    </Button>
                                </div>
                            </div>
                        )}

                        {step === 6 && (
                            <div className="flex flex-col gap-6 flex-1 justify-center">
                                <h1 className="text-3xl font-extrabold">Narrator persona</h1>
                                <p className="text-sm opacity-70">The voice that tells the story. Let the AI determine a tone that fits everything you've defined — then tweak it to taste.</p>

                                <AnimateChangeInHeight className="palmirror-exc rounded-2xl">
                                    <div className="p-4 px-6 flex flex-col gap-3">
                                        <div className="flex gap-2">
                                            <Button onClick={generateNarrator} disabled={narratorGenerating || worldName.trim() === ""}>
                                                {narratorGenerating ? <Loader2 className="animate-spin" /> : <Sparkles />} {narratorGenerating ? "Determining tone..." : "Let the AI determine the tone"}
                                            </Button>
                                            {narratorResult && <Button variant="outline" onClick={useGeneratedNarrator}><Check /> Use this</Button>}
                                        </div>

                                        {showNarratorResult && (
                                            <div className="flex flex-col gap-2">
                                                {narratorReasoning && showNarratorReasoning && (
                                                    <div className="border border-white/10 rounded-xl p-4 flex flex-col gap-2">
                                                        <h2 className="font-bold opacity-50 italic tracking-widest text-sm w-full text-end">Thinking</h2>
                                                        <div ref={narratorScrollRef} className="max-h-40 text-xs opacity-50 overflow-y-auto whitespace-pre-wrap">{narratorReasoning}</div>
                                                    </div>
                                                )}
                                                <div className="border border-white/10 rounded-xl p-4 min-h-24 whitespace-pre-wrap text-sm">{narratorResult}</div>
                                            </div>
                                        )}
                                    </div>
                                </AnimateChangeInHeight>

                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="narratorPersona">Narrator persona <span className="text-red-500">*</span></Label>
                                    <Textarea id="narratorPersona" rows={5} value={narratorPersona} onChange={(e) => setNarratorPersona(e.target.value)} placeholder="e.g. A dry, cinematic third-person storyteller with a darkly comic edge..." />
                                </div>
                            </div>
                        )}

                        {step === 7 && (
                            <div className="flex flex-col gap-6 flex-1 justify-center">
                                <h1 className="text-3xl font-extrabold">Review your world</h1>
                                <div className="flex flex-col gap-3">
                                    <div className="border border-white/10 rounded-xl p-4 flex flex-col gap-1">
                                        <h2 className="font-bold text-lg flex items-center gap-2">{worldName}</h2>
                                        <p className="text-xs opacity-50">{worldCharacters.length} character{worldCharacters.length !== 1 ? "s" : ""} · {worldObjects.length} object{worldObjects.length !== 1 ? "s" : ""} · {narrativeMode} narration</p>
                                    </div>
                                    <div className="border border-white/10 rounded-xl p-4 flex flex-col gap-1">
                                        <h2 className="font-bold text-sm opacity-70">Premise</h2>
                                        <p className="text-sm whitespace-pre-wrap">{premise}</p>
                                    </div>
                                    <div className="border border-white/10 rounded-xl p-4 flex flex-col gap-1">
                                        <h2 className="font-bold text-sm opacity-70">Narrator persona</h2>
                                        <p className="text-sm whitespace-pre-wrap">{narratorPersona || "(none)"}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                <div className="flex gap-2 pt-6 w-full">
                    {step > 0 && (
                        <Button variant="outline" onClick={back} disabled={creating}><ArrowLeft /> Back</Button>
                    )}
                    {step < STEPS.length - 1 ? (
                        <Button className="flex-1" onClick={next}>Continue <ArrowRight /></Button>
                    ) : (
                        <Button className="flex-1" variant="palmirror" onClick={createWorld} disabled={creating}>
                            {creating ? <Loader2 className="animate-spin" /> : <Earth />} {creating ? "Creating world..." : "Create World"}
                        </Button>
                    )}
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
};

export default WorldCreatePage;
