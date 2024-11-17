// components/MessageCard.tsx
import React, { useCallback, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import ReactMarkdown from 'react-markdown';
import { useSpring, animated } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';
import { Pencil, Rewind, Check } from 'lucide-react';
import { Button } from "@/components/ui/button";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"


interface MessageCardProps {
  index: number;
  content: string;
  role: string;
  stillGenerating: boolean;
  regenerateFunction: () => void;
  globalIsThinking: boolean;
  isLastMessage: boolean;
  characterData: {
    name: string;
    personality: string;
    initialMessage: string;
    scenario: string;
    userName: string;
    userPersonality: string;
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
  characterData,
  editMessage,
  rewindTo,
}) => {
  const [{ x, y, scale, height, fontSize, blur }, apiSpring] = useSpring(() => ({
    x: 0,
    y: 0,
    scale: 1,
    height: 100,
    fontSize: 1,
    blur: 0,
  }));
  const [aboutToRegenerate, setAboutToRegenerate] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingContent, setEditingContent] = useState('');

  const triggerRegenerate = useCallback(() => {
    regenerateFunction();
    console.log("trigger");
  }, [regenerateFunction]);

  const startEditing = () => {
    setEditingContent(content)
    setIsEditing(true)
  }

  const bind = useDrag(({ down, movement: [mx], velocity: [vx] }) => {
    const dragThreshold = -200;
    const isUserRole = role === "user";
    const isEligibleForRegenerate =
      !globalIsThinking && !stillGenerating && role !== "user" && !isEditing && isLastMessage;

    const isRegenerateAction = mx < dragThreshold && isEligibleForRegenerate;

    if (isRegenerateAction && !aboutToRegenerate) {
      setAboutToRegenerate(true);
      vibrate(50);
    }

    apiSpring.start({
      x: down
        ? (mx >= 0
          ? 0.15 * mx
          : 0.75 * mx) /
        (isUserRole || stillGenerating || !isLastMessage || globalIsThinking || isEditing ? 10 : 1) + (isRegenerateAction ? -50 : 0)
        : 0,
      y: 0,
      scale: down ? (isRegenerateAction ? .8 : .97) : 1,
      height: 100,
      blur: isRegenerateAction ? 5 : 0,
      config: { tension: 120, friction: 14 },
    });

    if ((vx < -10 || mx < dragThreshold) && !down && isEligibleForRegenerate) {
      apiSpring.start({
        x: -500,
        y: 0,
        scale: 0,
        height: 0,
        fontSize: 0,
        blur: 30,
        config: { tension: 120, friction: 14 },
      });
      setTimeout(triggerRegenerate, 250);
    }
  });

  return (
    <animated.div
      style={{
        x,
        y,
        scale,
        height: height.to((h) => `${h}%`),
        fontSize: fontSize.to((s) => `${s}rem`),
        filter: blur.to((b) => `blur(${b}px)`),
      }}
      className="flex flex-col justify-end gap-2 min-h-full overflow-hidden"
    >
      <p className={`${role === "user" ? "ml-auto" : "mr-auto"} text-xs opacity-50`}>
        {role === "user" ? "" : characterData.name || "Character"}
      </p>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <Card
            {...bind()}
            className={`bg-blue-900/20 rounded-xl max-w-lg border-0 grow-0 shrink h-fit touch-none ${role === "user"
              ? "bg-blue-950/20 ml-auto rounded-br-md text-end"
              : "bg-gray-900/10 mr-auto rounded-bl-md"
              } ${isEditing ? "w-full" : ""}`}
          >
            <CardContent className="p-2 px-4">
              <div className="whitespace-pre-line break-words max-w-full markdown-content overflow-hidden">
                {isEditing ? (
                  <div className="flex flex-col gap-2 justify-start items-end"> 
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
                      onChange={(e) => { setEditingContent(e.target.value) }}
                    />
                  </div>
                ) : (
                  <ReactMarkdown className={stillGenerating ? "animate-pulse" : ""}>{content.replace(/\{\{user\}\}/g, characterData.userName || "Y/N")}</ReactMarkdown>
                )}

              </div>
            </CardContent>
          </Card>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-64 font-sans font-semibold">
          <ContextMenuItem onClick={() => {rewindTo(index)}} disabled={stillGenerating} asChild>
            <span className="flex items-center gap-2">
              <Rewind className="h-4 w-4" />
              Rewind to here
            </span>
          </ContextMenuItem>
          <ContextMenuItem onClick={() => startEditing()} disabled={stillGenerating} asChild>
            <span className="flex items-center gap-2">
              <Pencil className="h-4 w-4" />
              Edit
            </span>
          </ContextMenuItem>
        </ContextMenuContent>

      </ContextMenu>

    </animated.div>
  );
};

export default MessageCard;
