/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ToastContainer } from "react-toastify";

import "react-toastify/dist/ReactToastify.css";

import { usePLMGlobalConfig } from "@/context/PLMGlobalConfig";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import NumberFlow from "@number-flow/react";

export default function SettingsPage() {
    const router = useRouter();
    const globalConfig = usePLMGlobalConfig();

    const [showHighend, setShowHighend] = useState(false);
    const [settings, setSettings] = useState<Record<string, any>>({});



    type BooleanSetting = {
        type: "boolean";
        key: string;
        default: boolean;
        label: string;
        onChange?: (value: boolean) => void;
    };

    type NumberSetting = {
        type: "number";
        key: string;
        default: number;
        label: string;
        min: number;
        max: number;
        step?: number;
        onChange?: (value: number) => void;
    };

    type SettingTypes = boolean | number

    type SettingConfig = BooleanSetting | NumberSetting;

    type SettingsGroup = {
        title: string;
        items: Record<string, SettingConfig>;
    };

    type Schema = Record<string, SettingsGroup>;

    const settingsSchema: Schema = {
        performance: {
            title: "Performance",
            items: {
                highend: {
                    type: "boolean",
                    key: "highend",
                    default: false,
                    label: "Enhanced textures & effects",
                    onChange: (value) => value && setShowHighend(true),
                },
                tokenCounter: {
                    type: "boolean",
                    key: "tokenCounter",
                    default: true,
                    label: "Response token watching",
                },
                limitChatRenders: {
                    type: 'boolean',
                    key: 'limitChatRenders',
                    default: false,
                    label: "Limit rendered chat messages at once"
                },
                limitChatRendersCount: {
                    type: 'number',
                    key: 'limitChatRendersCount',
                    default: 3,
                    label: "Max rendered chat messages",
                    min: 1,
                    max: 20,
                    step: 1,
                }
            },
        },
        chat: {
            title: "Chat",
            items: {
                enterSendsChat: {
                    type: "boolean",
                    key: "enterSendsChat",
                    default: true,
                    label: "Enter sends chat message",
                }
            }
        },
        domains: {
            title: "Experience Engine Domains",
            items: {
                domainTimestepRecallDepth: {
                    type: "number",
                    key: "domains_timestep_recall",
                    default: 20,
                    label: "Timestep recall depth",
                    min: 3,
                    max: 30,
                    step: 1,
                },
                domainChatCompressor: {
                    type: 'boolean',
                    key: 'domainChatCompressor',
                    default: false,
                    label: 'Compress further chats into less tokens'  
                },
                domainChatCompressorDepth: {
                    type: "number",
                    key: "domainChatCompressorDepth",
                    default: 5,
                    label: "Number of chats before compression",
                    min: 1,
                    max: 10,
                    step: 1,
                }
            },
        },
        effects: {
            title: "Effects",
            items: {
                typing: {
                    type: "boolean",
                    key: "typing",
                    default: true,
                    label: "Message typing effects",
                },
            }
        },
        experiments: {
            title: "Experiments",
            items: {
                cascadingApiProviders: {
                    type: "boolean",
                    key: "cascadingApiProviders",
                    default: false,
                    label: "Cascading API providers (fallbacks)",
                },
                cardFlyIn: {
                    type: "boolean",
                    key: "cardFlyIn",
                    default: false,
                    label: "Home card fly in animation",
                },
                autoCloseFormatting: {
                    type: 'boolean',
                    key: 'autoCloseFormatting',
                    default: false,
                    label: "Automatically close formatting (italics, quotes)"
                },
                novelImageGeneration: {
                    type: 'boolean',
                    key: 'novelImageGeneration',
                    default: false,
                    label: "Generate visual novel-like images"
                }
            },
        },
    };

    useEffect(() => {
        const loaded: Record<string, any> = {};
        for (const groupId in settingsSchema) {
            const group = settingsSchema[groupId];
            for (const settingId in group.items) {
                const cfg = group.items[settingId];
                loaded[settingId] = globalConfig.get(cfg.key) ?? cfg.default;
            }
        }
        setSettings(loaded);
    }, []);

    function updateSetting(settingId: string, value: SettingTypes) {
        let cfg: SettingConfig | null = null;

        for (const group of Object.values(settingsSchema)) {
            if (group.items[settingId]) {
                cfg = group.items[settingId];
                break;
            }
        }

        if (!cfg) return;

        setSettings((prev) => ({ ...prev, [settingId]: value }));
        globalConfig.set(cfg.key, value, true);

        if (cfg.onChange) {
            if (cfg.type === "boolean") cfg.onChange(value as boolean);
            if (cfg.type === "number") cfg.onChange(value as number);
        }
    }


    function renderSetting(settingId: string, cfg: SettingConfig) {
        switch (cfg.type) {
            case "boolean":
                return (
                    <div key={settingId} className="flex items-center gap-2">
                        <Checkbox
                            id={`checkbox-${settingId}`}
                            checked={settings[settingId] ?? cfg.default}
                            onCheckedChange={(val) => updateSetting(settingId, !!val)}
                        />
                        <Label htmlFor={`checkbox-${settingId}`} className="text-xs">
                            {cfg.label}
                        </Label>
                    </div>
                );
            case "number":
                return (
                    <div className="flex flex-col gap-2">
                        <Label htmlFor={`slider-${settingId}`} className="text-xs">
                            {cfg.label}
                        </Label>
                        <div key={settingId} className="flex items-center gap-2 w-full max-w-[20rem]">
                            <Slider
                                id={`slider-${settingId}`}
                                min={cfg.min}
                                max={cfg.max}
                                step={cfg.step ?? 1}
                                value={[settings[settingId]]}
                                defaultValue={[cfg.default]}
                                onValueChange={(e) => updateSetting(settingId, Number(e[0]))}
                            />
                            <NumberFlow transformTiming={{ duration: 30 }} opacityTiming={{ duration: 0 }} value={settings[settingId]} className="text-sm opacity-50 w-10 text-right">
                            </NumberFlow>
                            
                        </div>
                    </div>
                );
        }
    }

    return (
        <div className="flex flex-col gap-6 min-h-screen px-8 lg:px-48 pb-20 p-8 sm:p-10 font-sans">
            <div className="flex justify-center sm:justify-between w-full">
                <h1 className="text-2xl font-extrabold tracking-tight">Settings</h1>
                <Button variant="outline" onClick={() => router.back()} className="hidden sm:block">
                    Back
                </Button>
            </div>

            {Object.entries(settingsSchema).map(([groupId, group]) => (
                <div key={groupId} className="flex flex-col gap-2">
                    <h2 className={`font-bold ${group.title === "Experiments" && "text-xl text-yellow-400 mt-12"}`}>{group.title}</h2>
                    {Object.entries(group.items).map(([settingId, cfg]) => renderSetting(settingId, cfg))}
                </div>
            ))}

            {/* Highend dialog */}
            <Dialog open={showHighend} onOpenChange={setShowHighend}>
                <DialogContent className="font-sans">
                    <DialogHeader>
                        <DialogTitle>Enhanced textures & effects</DialogTitle>
                    </DialogHeader>
                    <DialogDescription>
                        {`This option enables effects such as progressive blur and heavy animations across the PalMirror app.
                        If you are using a low-ended device/not a desktop, it's best to keep this feature turned off to ensure a smooth experience.`}
                    </DialogDescription>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            onClick={() => {
                                updateSetting("highend", false);
                                setShowHighend(false);
                            }}
                        >
                            Disable
                        </Button>
                        <Button onClick={() => setShowHighend(false)} variant="outline">
                            Continue anyway
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ToastContainer theme="dark" position="top-right" />
        </div>
    );
}
