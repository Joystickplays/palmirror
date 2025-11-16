"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ToastContainer, toast } from "react-toastify";

import "react-toastify/dist/ReactToastify.css";

import { usePLMGlobalConfig } from "@/context/PLMGlobalConfig";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function SettingsPage() {
    const router = useRouter();
    const globalConfig = usePLMGlobalConfig();



    const [showHighend, setShowHighend] = useState(false);


    type SettingConfig = {
        key: string;
        default: boolean;
        label: string;
        onChange?: (value: boolean) => void;
    };

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
                    key: "highend",
                    default: false,
                    label: "Enhanced textures & effects",
                    onChange: (value) => value && setShowHighend(true),
                },
            },
        },
    };

    const [settings, setSettings] = useState<Record<string, any>>({});

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

    function updateSetting(settingId: string, value: boolean) {
        let cfg: SettingConfig | null = null;

        for (const groupId in settingsSchema) {
            const group = settingsSchema[groupId];
            if (group.items[settingId]) {
                cfg = group.items[settingId];
                break;
            }
        }

        if (!cfg) return;

        setSettings((prev) => ({ ...prev, [settingId]: value }));
        globalConfig.set(cfg.key, value, true);

        if (cfg.onChange) cfg.onChange(value);
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
                    <h2 className="font-bold">{group.title}</h2>

                    {Object.entries(group.items).map(([settingId, cfg]) => (
                        <div key={settingId} className="flex items-center gap-2">
                            <Checkbox
                                id={`checkbox-${settingId}`}
                                checked={settings[settingId] ?? false}
                                onCheckedChange={(val) => updateSetting(settingId, !!val)}
                            />
                            <Label htmlFor={`checkbox-${settingId}`} className="text-xs">
                                {cfg.label}
                            </Label>
                        </div>
                    ))}
                </div>
            ))}



            {/* highend  dialog */}
            <Dialog open={showHighend} onOpenChange={setShowHighend}>
                <DialogContent className="font-sans">
                    <DialogHeader>
                        <DialogTitle>
                            {`Enhanced textures & effects`}
                        </DialogTitle>
                    </DialogHeader>
                    <DialogDescription>
                        {`This option enables effects such as progressive blur and heavy animations across the PalMirror app. If you are using a low-ended device/not a desktop, it's best to keep this feature turned off to ensure a smooth experience.`}
                    </DialogDescription>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button onClick={() => { updateSetting("highend", false); setShowHighend(false); }}>Disable</Button>
                        <Button onClick={() => { setShowHighend(false); }} variant="outline">Continue anyway</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ToastContainer theme="dark" position="top-right" />
        </div>
    );
}
