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
} from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useTheme } from "@/components/PalMirrorThemeProvider";
import { AnimatePresence, motion } from "framer-motion";
import { CharacterData, defaultCharacterData } from "@/types/CharacterData";

import Stopwatch from "@/components/Stopwatch"

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
  showSteerModal: () => void;
}

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
  showSteerModal,
}) => {
  const [localMessage, setLocalMessage] = useState(newMessage);
  const localMessageRef = useRef<string>("");

  const inputRef = useRef<HTMLTextAreaElement>(null);

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

  const localHandleSendMessage = (
    e: React.KeyboardEvent<HTMLTextAreaElement> | null
  ) => {
    if (e && e.key === "Enter") {
      e.preventDefault();
      setNewMessage(localMessageRef.current);
      handleSendMessage(
        {
          key: "Enter",
          ctrlKey: false,
        } as React.KeyboardEvent<HTMLTextAreaElement>,
        false,
        false,
        localMessageRef.current
      );
      emptyMessage();
    }
  };

  const handleButtonClick = () => {
    if (isThinking || userPromptThinking) {
      onCancel();
    } else {
      setNewMessage(localMessageRef.current);
      handleSendMessage(
        {
          key: "Enter",
          ctrlKey: false,
        } as React.KeyboardEvent<HTMLTextAreaElement>,
        false,
        false,
        localMessageRef.current
      );
      emptyMessage();
    }
  };

  useEffect(() => { if (isThinking) { setFirstThinking(new Date) } }, [isThinking])

  return (
    <div className="relative w-full">
      <Textarea
        id="Message"
        className={`w-full p-2 ${userPromptThinking ? "text-white/50" : ""} ${
          currentTheme.assistantBg
        } rounded-[27px] rounded-t-2xl pr-16 pl-4`}
        value={localMessage}
        onChange={handleInputChange}
        onKeyDown={(e) => localHandleSendMessage(e)}
        ref={inputRef}
        onBlur={() => { setNewMessage(localMessageRef.current) }}
        disabled={userPromptThinking}
      />
      <div className="absolute right-2 top-0 px-2 pt-1">
        {
          isThinking && ( <Stopwatch startDate={firstThinking} tokenHitStamps={tokenHitStamps}/> )
        }
      </div>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <motion.div
          className="absolute right-2 bottom-2"
          whileTap={{ scale: 0.8 }}
          transition={{ type: 'spring', mass: 1, stiffness: 200, damping: 11 }}>
            <Button
              className=" p-2 rounded-full"
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
          <ContextMenuItem
            onClick={suggestReply}
            disabled={isThinking || userPromptThinking}
          >
            <span className="flex items-center gap-2">
              <MessageSquareQuote className="h-4 w-4" />
              Suggest a reply
            </span>
          </ContextMenuItem>

          <ContextMenuItem
            onClick={() => rewriteMessage(localMessageRef.current)}
            disabled={isThinking || userPromptThinking}
          >
            <span className="flex items-center gap-2">
              <PenLine className="h-4 w-4" />
              Rewrite message
            </span>
          </ContextMenuItem>

          <ContextMenuItem onClick={showSkipToSceneModal}
            disabled={isThinking || userPromptThinking}>
            <span className="flex items-center gap-2">
              <ArrowDownNarrowWide className="h-4 w-4" />
              Skip to scene...
            </span>
          </ContextMenuItem>

          <ContextMenuItem onClick={showSteerModal}>
            <span className="flex items-center gap-2">
              <ShipWheel className="h-4 w-4" />
              Steer the story
            </span>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
};

export default MessageInput;
