// components/MessageCard.tsx
import React, { useCallback, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import ReactMarkdown from 'react-markdown';
import { useSpring, animated } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';
import { Pencil, Rewind, Check, MessagesSquare } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useTheme } from '@/components/PalMirrorThemeProvider';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"


interface MessageCardProps {
  index: number;
  content: string;
  role: string;
  stillGenerating: boolean;
  regenerateFunction: () => void;
  globalIsThinking: boolean;
  isGreetingMessage: boolean;
  isLastMessage: boolean;
  characterData: {
    name: string;
    userName: string;
    alternateInitialMessages: Array<string> | null | undefined
  };
  editMessage: (index: number, content: string) => void;
  rewindTo: (index: number) => void;
}

const vibrate = (duration: number) => {
  if ("vibrate" in navigator) {
    navigator.vibrate(duration);
  }
};

const MessageCard: React.FC<MessageCardProps> = ({
  index,
  content,
  role,
  stillGenerating,
  regenerateFunction,
  globalIsThinking,
  isLastMessage,
  isGreetingMessage,
  characterData,
  editMessage,
  rewindTo,
}) => {
  const [{ scale }, apiScaleSpring] = useSpring(() => ({
    scale: 1,
    config: { tension: 100, friction: 20 },
  }));

  const [{ x, y, height, fontSize, blur }, apiSpring] = useSpring(() => ({
    x: 0,
    y: 0,
    height: 100,
    fontSize: 1,
    blur: 0,
  }));

  const [aboutToRegenerate, setAboutToRegenerate] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingContent, setEditingContent] = useState('');
  const { theme, setTheme } = useTheme();

  const triggerRegenerate = useCallback(() => {
    regenerateFunction();
  }, [regenerateFunction]);

  const startEditing = () => {
    setEditingContent(content);
    setIsEditing(true);
  }

  const bind = useDrag(({ down, movement: [mx], velocity: [vx] }) => {
    const dragThreshold = -200;
    const isEligibleForRegenerate = !globalIsThinking && !stillGenerating && role !== "user" && !isEditing && isLastMessage;
    const isRegenerateAction = mx < dragThreshold && isEligibleForRegenerate;

    if (isRegenerateAction && !aboutToRegenerate) {
      setAboutToRegenerate(true);
      vibrate(50);
    }

    apiSpring.start({
      x: down
        ? (0.75 * mx) / (role === "user" || stillGenerating || !isLastMessage || globalIsThinking || isEditing ? 10 : 1) + (isRegenerateAction ? -50 : 0)
        : 0,
      y: 0,
      height: 100,
      blur: isRegenerateAction ? 5 : 0,
      fontSize: 1,
      config: { tension: 190, friction: 18 },
    });

    apiScaleSpring.start({
      scale: down ? (isRegenerateAction ? 0.8 : 0.97) : 1,
    });

    if ((vx < -10 || mx < dragThreshold) && !down && isEligibleForRegenerate) {
      apiSpring.start({
        x: -500,
        y: 0,
        height: 0,
        fontSize: 0,
        blur: 30,
        config: { tension: 190, friction: 18 },
      });
      setTimeout(triggerRegenerate, 250);
    }
  }, { axis: "x", bounds: { left: -350, right: 0 }, rubberband: true });

  const charUserSubstitution = (content: string) => {
    return content.replace(/\{\{user\}\}/g, characterData.userName || "Y/N").replace(/\{\{char\}\}/g, characterData.name || "C/N")
  }

  const renderContent = () => {
    if (isEditing) {
      return (
        <div className="flex flex-col gap-2 items-end">
          <Button onClick={() => {
            editMessage(index, editingContent);
            setIsEditing(false);
          }}>
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4 text-black" />
              Done
            </span>
          </Button>
          <textarea
            className="w-full bg-transparent resize-none border rounded-xl w-full h-52 p-3"
            value={editingContent}
            onChange={(e) => setEditingContent(e.target.value)}
          />
        </div>
      );
    }

    return (
      <ReactMarkdown className={`${stillGenerating ? "animate-pulse" : ""} select-none opacity-95 leading-relaxed`}>
        {charUserSubstitution(content)}
      </ReactMarkdown>
    );
  };

  return (
    <animated.div
      style={{
        x,
        y,
        scale,
        height: height.to(h => `${h}%`),
        fontSize: fontSize.to(s => `${s}rem`),
        filter: blur.to(b => `blur(${b}px)`),
        gap: fontSize.to(s => `${s / 2}rem`),
        marginTop: fontSize.to(s => `${s / 2}rem`)
      }}
      className="flex flex-col justify-end min-h-full overflow-hidden"
    >
      <animated.p className={`${role === "user" ? "ml-auto" : "mr-auto"} opacity-50`} style={{ fontSize: fontSize.to(s => `${s / 1.5}rem`) }}>
        {role === "user" ? `${theme === "cai" ? characterData.userName || "Y/N" : ""}` : characterData.name || "Character"}
      </animated.p>
      <Dialog> {/* Alternate messages dialog */}

        <DialogContent className="w-auto max-h-[80vh] max-w-[100vw] min-w-[90vw] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="mb-8">Choose an alternate initial message</DialogTitle>
            {/* <Select>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose an alternate initial message" />
              </SelectTrigger>
              <SelectContent> */}
            {characterData.alternateInitialMessages && characterData.alternateInitialMessages.map((message, index) => {
              return (
                <Card key={index} className="mb-4 p-3 text-left">
                  <CardContent className="p-2">
                    <ReactMarkdown className="font-sans markdown-content leading-relaxed">
                      {charUserSubstitution(message)}
                    </ReactMarkdown>
                    <DialogClose asChild>
                      <Button onClick={() => {
                        editMessage(0, message);
                        setIsEditing(false);
                      }} className="mt-5 w-full">Use</Button>
                    </DialogClose>
                  </CardContent>
                </Card>
              );
            })}
            {/* </SelectContent>
            </Select> */}
          </DialogHeader>
        </DialogContent>

        <ContextMenu>
          <ContextMenuTrigger asChild>
            <Card
              {...bind()}
              className={`bg-blue-900/20 rounded-xl max-w-lg border-0 grow-0 shrink h-fit touch-pan-y ${role === "user"
                ? `${theme == "cai" ? "bg-[#303136]/50" : ""} ${theme == "palmirror" ? "bg-blue-950/20" : ""} ml-auto rounded-br-md text-end`
                : `${theme == "cai" ? "bg-[#26272b]/50" : ""} ${theme == "palmirror" ? "bg-gray-900/10" : ""} mr-auto rounded-bl-md`
                } ${isEditing ? "w-full" : ""}`}
            >
              <CardContent className="p-0">
                <animated.div className="whitespace-pre-line break-words max-w-full markdown-content overflow-hidden" style={{
                  padding: fontSize.to(s => `${s / 2}rem`),
                  paddingLeft: fontSize.to(s => `${s}rem`),
                  paddingRight: fontSize.to(s => `${s}rem`),
                }}>
                  {renderContent()}
                </animated.div>
              </CardContent>
            </Card>
          </ContextMenuTrigger>
          <ContextMenuContent className="w-64 font-sans font-semibold">
            {isGreetingMessage && characterData.alternateInitialMessages && (
              <DialogTrigger asChild>
                <ContextMenuItem asChild>
                  <span className="flex items-center gap-2">
                    <MessagesSquare className="h-4 w-4" />
                    Choose an alternate initial message
                  </span>
                </ContextMenuItem>
              </DialogTrigger>


            )}
            <ContextMenuItem onClick={() => rewindTo(index)} disabled={stillGenerating} asChild>
              <span className="flex items-center gap-2">
                <Rewind className="h-4 w-4" />
                Rewind to here
              </span>
            </ContextMenuItem>
            <ContextMenuItem onClick={startEditing} disabled={stillGenerating} asChild>
              <span className="flex items-center gap-2">
                <Pencil className="h-4 w-4" />
                Edit
              </span>
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </Dialog>
    </animated.div >
  );
};

export default MessageCard;
