import React, { useState, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Send,
  OctagonX,
  MessageSquareQuote,
  PenLine,
  ShipWheel,
  ArrowDownNarrowWide,
  Package,
  X,
} from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { useTheme } from "@/context/PalMirrorThemeProvider";
import { AnimatePresence, motion } from "framer-motion";
import { CharacterData, defaultCharacterData } from "@/types/CharacterData";
import { WorldObject, WorldObjectAction } from "@/types/EEDomain";

import Stopwatch from "@/components/utilities/Stopwatch"

interface MessageInputProps {
  newMessage: string;
  setNewMessage: React.Dispatch<React.SetStateAction<string>>;
  handleSendMessage: (
    e: React.KeyboardEvent<HTMLTextAreaElement> | null,
    force?: boolean,
    regenerate?: boolean,
    optionalMessage?: string
  ) => void;
  onCancel: () => void;
  isThinking: boolean;
  userPromptThinking: boolean;
  tokenHitStamps: Array<number>;
  suggestReply: () => void;
  rewriteMessage: (base: string) => void;
  showSkipToSceneModal: () => void;
  configTokenWatch: boolean;
  configEnterSendsChat: boolean;
  isWorldDomain?: boolean;
  worldObjects?: WorldObject[];
  pendingObjectAction?: { object: WorldObject; action: WorldObjectAction } | null;
  onAttachObjectAction?: (object: WorldObject, action: WorldObjectAction) => void;
  onClearObjectAction?: () => void;
}

type ActionPrefix = "" | "DO" | "SAY" | "ASK" | "STORY";

const ACTION_PREFIXES: Array<{ prefix: ActionPrefix; label: string }> = [
  { prefix: "DO", label: "Do" },
  { prefix: "SAY", label: "Say" },
  { prefix: "ASK", label: "Ask" },
  { prefix: "STORY", label: "Story" },
];

const PREFIX_PLACEHOLDERS: Record<string, string> = {
  DO: "Do something... (narrator will narrate your action)",
  SAY: 'Say something... ("...")',
  ASK: "Ask something...",
  STORY: "Give the story a direction...",
};

const MessageInput: React.FC<MessageInputProps> = ({
  newMessage,
  setNewMessage,
  handleSendMessage,
  onCancel,
  isThinking,
  userPromptThinking,
  tokenHitStamps,
  suggestReply,
  rewriteMessage,
  showSkipToSceneModal,
  configTokenWatch,
  configEnterSendsChat,
  isWorldDomain = false,
  worldObjects = [],
  pendingObjectAction = null,
  onAttachObjectAction,
  onClearObjectAction,
}) => {
  const [localMessage, setLocalMessage] = useState(newMessage);
  const localMessageRef = useRef<string>("");
  const [actionPrefix, setActionPrefix] = useState<ActionPrefix>("");

  useEffect(() => {
    setLocalMessage(newMessage);
  }, [newMessage]);

  const { theme, getTheme, setTheme } = useTheme();
  const currentTheme = getTheme();

  const [firstThinking, setFirstThinking] = useState(new Date)

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setLocalMessage(value);
    localMessageRef.current = value;
  };

  const emptyMessage = () => {
    setLocalMessage("");
    localMessageRef.current = "";
  };

  const buildOutgoingMessage = () => {
    const trimmed = localMessageRef.current.trim();
    if (!pendingObjectAction && actionPrefix && trimmed !== "") {
      return `${actionPrefix} ${trimmed}`;
    }
    return localMessageRef.current;
  };

  const localHandleSendMessage = (
    e: React.KeyboardEvent<HTMLTextAreaElement> | null
  ) => {
    if (e && e.key === "Enter" && !e.shiftKey && configEnterSendsChat) {
      e.preventDefault();
      handleSendMessage(
        {
          key: "Enter",
          ctrlKey: false,
        } as React.KeyboardEvent<HTMLTextAreaElement>,
        false,
        false,
        buildOutgoingMessage()
      );
      emptyMessage();
    }
  };

  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    
    // if (e && e.button !== 0) {
    //   return;
    // }
    if (isThinking || userPromptThinking) {
      onCancel();
    } else {
      setNewMessage(buildOutgoingMessage());
      handleSendMessage(
        {
          key: "Enter",
          ctrlKey: false,
        } as React.KeyboardEvent<HTMLTextAreaElement>,
        false,
        false,
        buildOutgoingMessage()
      );
      emptyMessage();
    }
  };

  useEffect(() => { if (isThinking) { setFirstThinking(new Date) } }, [isThinking])

  return (
    <div className="relative w-full">
      {isWorldDomain && (
        <div className="flex gap-1 mb-1 px-1">
          <div className="flex gap-1 flex-wrap">
            {ACTION_PREFIXES.map(({ prefix, label }) => (
              <Button
                key={prefix}
                size="sm"
                variant={actionPrefix === prefix ? "default" : "outline"}
                className="h-7 px-3 text-xs font-bold"
                onClick={() => setActionPrefix(actionPrefix === prefix ? "" : prefix)}
              >
                {label}
              </Button>
            ))}
          </div>
          {actionPrefix && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs opacity-60 ml-auto"
              onClick={() => setActionPrefix("")}
            >
              Clear
            </Button>
          )}
        </div>
      )}
      {isWorldDomain && pendingObjectAction && onClearObjectAction && (
        <div className="mb-1 px-1">
          <motion.div 
          initial={{
            y: 10,
            opacity: 0,
          }}
          animate={{
            y: 0,
            opacity: 1,
          }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 pl-2.5 pr-2 py-1 w-fit">
            {pendingObjectAction.object.image && (
              <img src={pendingObjectAction.object.image} alt="" className="size-5 rounded-full object-cover shrink-0" />
            )}
            <span className="text-xs font-semibold truncate max-w-48">
              <span className="opacity-70">{pendingObjectAction.object.name || "Object"}</span>
              <span className="opacity-40 mx-1">—</span>
              <span className="text-primary">{pendingObjectAction.action.name}</span>
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="h-5 w-5 p-0 text-xs opacity-60"
              disabled={isThinking || userPromptThinking}
              onClick={onClearObjectAction}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </motion.div>
        </div>
      )}
      <Textarea
        id="Message"
        className={`w-full p-2 ${userPromptThinking ? "text-white/50" : ""} ${
          currentTheme.assistantBg
        } rounded-[27px] rounded-t-2xl sm:rounded-b-none ring-0! ring-offset-0! pr-16 pl-4`}
        value={localMessage}
        onChange={handleInputChange}
        onKeyDown={(e) => localHandleSendMessage(e)}
        disabled={userPromptThinking}
        placeholder={isWorldDomain && actionPrefix ? PREFIX_PLACEHOLDERS[actionPrefix] : "Send a message..."}
      />
      <div className="absolute right-2 top-0 px-2 pt-1">
        {
          configTokenWatch && isThinking && ( <Stopwatch startDate={firstThinking} tokenHitStamps={tokenHitStamps}/> )
        }
      </div>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <motion.div
          className="absolute right-2 bottom-2 sm:right-0 sm:bottom-0"
          // whileTap={{ scale: 0.8 }}
          // transition={{ type: 'spring', mass: 1, stiffness: 200, damping: 11 }}
          >
            <Button
              className=" p-2 rounded-full sm:rounded-none sm:rounded-tl-xl"
              size="icon"
              onClick={handleButtonClick}
            >
              {isThinking || userPromptThinking ? (
                <OctagonX className="animate-pulse" />
              ) : (
                <Send />
              )}
            </Button>
          </motion.div>
        </ContextMenuTrigger>

        <ContextMenuContent className="w-64 font-sans font-semibold">
          
          {isWorldDomain && onAttachObjectAction && (
            <>
              <ContextMenuSub>
                <ContextMenuSubTrigger disabled={isThinking || userPromptThinking}>
                  <span className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Interact with object...
                  </span>
                </ContextMenuSubTrigger>
                <ContextMenuSubContent className="w-64">
                  {worldObjects.filter((o) => (o.actions || []).some((a) => a.name.trim() !== "")).length === 0 ? (
                    <ContextMenuItem disabled>
                      <span className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        No objects with actions yet
                      </span>
                    </ContextMenuItem>
                  ) : (
                    worldObjects
                      .filter((o) => (o.actions || []).some((a) => a.name.trim() !== ""))
                      .map((object) => (
                        <ContextMenuSub key={object.id}>
                          <ContextMenuSubTrigger>
                            <span className="flex items-center gap-2 min-w-0 flex-1">
                              {object.image && (
                                <img src={object.image} alt="" className="size-5 rounded object-cover shrink-0" />
                              )}
                              <span className="truncate">{object.name || "Unnamed object"}</span>
                            </span>
                          </ContextMenuSubTrigger>
                          <ContextMenuSubContent className="w-64">
                            {(object.actions || [])
                              .filter((a) => a.name.trim() !== "")
                              .map((action) => (
                                <ContextMenuItem
                                  key={action.id}
                                  onSelect={(e) => {
                                    e.stopPropagation();
                                    onAttachObjectAction(object, action);
                                  }}
                                >
                                  <span className="flex items-center gap-2">
                                    <ShipWheel className="h-4 w-4" />
                                    {action.name}
                                  </span>
                                </ContextMenuItem>
                              ))}
                          </ContextMenuSubContent>
                        </ContextMenuSub>
                      ))
                  )}
                </ContextMenuSubContent>
              </ContextMenuSub>
              <ContextMenuSeparator />

            </>
          )}

          {/* <ContextMenuItem
            onClick={() => rewriteMessage(localMessageRef.current)}
            disabled={isThinking || userPromptThinking}
          >
            <span className="flex items-center gap-2">
              <PenLine className="h-4 w-4" />
              Rewrite message
            </span>
          </ContextMenuItem> */}

          <ContextMenuItem
            onSelect={(e) => {
              e.stopPropagation(); 
              suggestReply();
            }}
            disabled={isThinking || userPromptThinking}
          >
            <span className="flex items-center gap-2">
              <MessageSquareQuote className="h-4 w-4" />
              Suggest replies...
            </span>
          </ContextMenuItem>

          <ContextMenuItem 
            onSelect={showSkipToSceneModal}
            disabled={isThinking || userPromptThinking}>
            <span className="flex items-center gap-2">
              <ArrowDownNarrowWide className="h-4 w-4" />
              Skip to scene...
            </span>
          </ContextMenuItem>


        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
};

export default MessageInput;
