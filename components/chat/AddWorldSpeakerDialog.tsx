"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, UserPlus } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from "@/components/ui/drawer";
import { independentInitOpenAI, generateChatCompletion } from "@/utils/portableAi";
import { getWorldCharacterPersonalitySysInst, WorldCharacterContext } from "@/utils/domainInstructionShaping/worldCharacterPersonalitySysInst";
import { addWorldCharacter } from "@/utils/domainData";

interface AddWorldSpeakerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  line: string;
  scene: string;
  domainId: string;
  worldContext?: WorldCharacterContext;
  onAdded: (name: string) => void;
}

const getProxyModel = (): string => {
  try {
    const settings = localStorage.getItem("Proxy_settings");
    if (settings) {
      const parsed = JSON.parse(settings);
      return parsed.modelName || "gpt-3.5-turbo";
    }
  } catch {}
  return "gpt-3.5-turbo";
};

const AddWorldSpeakerDialog: React.FC<AddWorldSpeakerDialogProps> = ({
  open,
  onOpenChange,
  name,
  line,
  scene,
  domainId,
  worldContext,
  onAdded,
}) => {
  const [personality, setPersonality] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sceneForPrompt = scene.trim().slice(0, 3000);

  const generate = useCallback(async () => {
    if (!name.trim() || generating) return;
    setGenerating(true);
    setError(null);
    setPersonality("");
    try {
      await independentInitOpenAI();
      const sysInst = getWorldCharacterPersonalitySysInst(
        name.trim(),
        sceneForPrompt ? [sceneForPrompt] : [],
        worldContext
      );
      const stream = generateChatCompletion({
        model: getProxyModel(),
        temperature: 0.7,
        stream: true,
        messages: [
          { role: "system", content: sysInst.trim() },
          { role: "user", content: `Generate the personality profile for ${name.trim()} now.` },
        ],
      });

      let output = "";
      for await (const chunk of stream) {
        output +=
          chunk.choices?.[0]?.message?.content ??
          chunk.choices?.[0]?.delta?.content ??
          "";
        setPersonality(output);
      }
    } catch (e) {
      console.warn("Personality generation failed", e);
      setError("Failed to generate a personality. You can write one manually.");
    } finally {
      setGenerating(false);
    }
  }, [name, sceneForPrompt, worldContext, generating]);

  useEffect(() => {
    if (open && name.trim()) {
      setPersonality("");
      setError(null);
      generate();
    }
  }, [open, name]);

  const handleSave = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      await addWorldCharacter(domainId, {
        id: crypto.randomUUID(),
        name: name.trim(),
        personality: personality.trim(),
        attributes: [],
      });
      onAdded(name.trim());
      onOpenChange(false);
    } catch (e) {
      console.warn("Failed to add world character", e);
      setError("Failed to add the character. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} repositionInputs={true}>
      <DrawerContent className="flex flex-col gap-2 items-center px-6 pb-4 w-full font-sans">
        <div className="flex gap-3 items-center my-6 mb-3">
          <UserPlus className="w-6 h-6" />
          <DrawerTitle className="text-2xl">{name.trim() || "Add speaker"}</DrawerTitle>
        </div>
        <p className="opacity-75 text-xs italic mb-2 max-w-[20rem] text-center">
          This character isn't part of the world yet. Generate a personality or write one yourself.
        </p>
        {line.trim() && (
          <p className="opacity-50 text-[10px] sm:text-xs italic max-w-120 mb-2 text-left">
            "{line.trim()}"
          </p>
        )}
        <div className="flex flex-col gap-2 w-full">
          <Textarea
            value={personality}
            onChange={(e) => setPersonality(e.target.value)}
            placeholder="A short personality profile for this character…"
            rows={4}
            disabled={generating || saving}
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-2 w-full">
            <Button variant="outline" className="flex-1" onClick={generate} disabled={generating || saving}>
              {generating ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-1 h-4 w-4" />
              )}
              {generating ? "Generating…" : "Regenerate"}
            </Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving || !name.trim()}>
              <UserPlus className="mr-1 h-4 w-4" />
              {saving ? "Adding…" : "Add to world"}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default AddWorldSpeakerDialog;
