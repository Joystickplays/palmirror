import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Send,
  OctagonX,
  MessageSquareQuote,
  PenLine,
  ShipWheel,
  Trash,
} from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTheme } from "@/components/PalMirrorThemeProvider";
import { CharacterData, defaultCharacterData } from "@/types/CharacterData";
import { AnimatePresence, motion } from "framer-motion";

import { AnimateChangeInHeight } from "@/components/AnimateHeight";

const MotionDialogContent = motion(DialogContent);

interface MessageInputProps {
  newMessage: string;
  setNewMessage: React.Dispatch<React.SetStateAction<string>>;
  handleSendMessage: (
    e: React.KeyboardEvent<HTMLTextAreaElement> | null,
    force?: boolean,
    regenerate?: boolean,
    optionalMessage?: string,
  ) => void;
  onCancel: () => void;
  isThinking: boolean;
  userPromptThinking: boolean;
  suggestReply: () => void;
  rewriteMessage: (base: string) => void;
  activeSteers: string[];
  addSteer: (steer: string) => void;
  removeSteer: (index: number) => void;
  steerApplyMethod: string;
  setSteerApplyMethod: React.Dispatch<React.SetStateAction<string>>;
  callSteer: () => void;
}

const MotionButton = motion(Button);

const MessageInput: React.FC<MessageInputProps> = ({
  newMessage,
  setNewMessage,
  handleSendMessage,
  onCancel,
  isThinking,
  userPromptThinking,
  suggestReply,
  rewriteMessage,
  activeSteers,
  addSteer,
  removeSteer,
  steerApplyMethod,
  setSteerApplyMethod,
  callSteer,
}) => {
  const [localMessage, setLocalMessage] = useState(newMessage);
  const localMessageRef = useRef<string>("");

  const [modalSteer, setModalSteer] = useState(false);
  const [newSteer, setNewSteer] = useState("");

  const [rudderRot, setRudderRot] = useState(0);
  const rotateRudder = () => {
    setRudderRot((p) => p + Math.floor(Math.random() * 91) - 90);
  };

  useEffect(() => {
    setLocalMessage(newMessage);
  }, [newMessage]);

  const { theme, getTheme, setTheme } = useTheme();
  const currentTheme = getTheme();

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
    e: React.KeyboardEvent<HTMLTextAreaElement> | null,
  ) => {
    if (e && e.key === "Enter") {
      e.preventDefault();
      handleSendMessage(
        {
          key: "Enter",
          ctrlKey: false,
        } as React.KeyboardEvent<HTMLTextAreaElement>,
        false,
        false,
        localMessageRef.current,
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
        localMessageRef.current,
      );
      emptyMessage();
    }
  };

  useEffect(() => {
    if (modalSteer) return;
    let i = 0;
    const id = setInterval(() => {
      document.body.style.pointerEvents = "auto";
      if (++i >= 10) clearInterval(id);
    }, 200);
    return () => clearInterval(id);
  }, [modalSteer]); /* weird ahh workaround. sue me */

  return (
    <div className="relative w-full">
      <AnimatePresence>
        {activeSteers.length > 0 ? (
          <motion.div
            key="steerIndication"
            initial={{ scale: 0, height: 0, margin: 0 }}
            animate={{ scale: 1, height: "fit-content", marginBottom: 8 }}
            exit={{ height: 0, opacity: 0, margin: 0, padding: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 16 }}
            className="opacity-50 text-sm px-2 mb-2 flex gap-2 items-center origin-bottom overflow-y-hidden"
          >
            <ShipWheel />
            <p>
              {activeSteers.length} Steer{activeSteers.length > 1 ? "s" : ""}{" "}
              {activeSteers.length > 1 ? "are" : "is"} active
            </p>
            <div className="flex overflow-x-auto gap-2 block ml-auto sm:max-w-[500px] max-w-[180px]">
            <Button
              variant="outline"
              className="h-6 px-2 py-0 text-xs opacity-75"
              onClick={() => setModalSteer(true)}
            >
              MANAGE STEERING
            </Button>
            <Button
              variant="outline"
              className="h-6 px-2 py-0 text-xs opacity-75"
              disabled={isThinking || userPromptThinking}
              onClick={() => callSteer()}
            >
              CALL STEER
            </Button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <Dialog open={modalSteer} onOpenChange={setModalSteer}>
        <MotionDialogContent className="max-h-[90vh] overflow-y-auto p-0 py-8 font-sans">
          <AnimateChangeInHeight className="p-8 py-0">
            <DialogTitle className="text-center text-2xl mb-4">
              Steering
            </DialogTitle>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1, transform: `rotate(${rudderRot}deg)` }}
              transition={{ type: "spring", stiffness: 50, damping: 8 }}
            >
              <ShipWheel className="h-32 w-32 block mx-auto" />
            </motion.div>
            <p className="px-4 text-center">
              Steer the story towards your direction in a way that&apos;s subtle
              and non-intrusive.
            </p>
            <p className="opacity-50 italic text-xs text-center mt-3">
              Steers do not save!
            </p>

            <h1 className="opacity-50 font-bold mt-6 mb-2">STEERS</h1>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2 mb-2">
                <Input
                  value={newSteer}
                  placeholder="New steer..."
                  onChange={(e) => setNewSteer(e.target.value)}
                />
                <Button
                  onClick={() => {
                    if (newSteer.length < 1) {
                      return;
                    }
                    addSteer(newSteer);
                    setNewSteer("");
                    rotateRudder();
                  }}
                >
                  Steer
                </Button>
              </div>
              <AnimatePresence mode="popLayout">
                {activeSteers.map((steer, index) => {
                  return (
                    <motion.div
                      key={steer}
                      initial={{
                        y: 50,
                        opacity: 0,
                        scale: 0.8,
                        filter: "blur(10px)",
                      }}
                      animate={{
                        y: 0,
                        opacity: 1,
                        scale: 1,
                        filter: "blur(0px)",
                      }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 100,
                        damping: 16,
                        delay: (index - 1) * 0.05,
                      }}
                      className="border rounded-xl p-4 flex gap-2 justify-between items-center flex-grow"
                      layout
                    >
                      <p className="break-words">{steer}</p>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => {
                          removeSteer(index);
                          rotateRudder();
                        }}
                        className="min-w-10 ml-2"
                      >
                        <Trash />
                      </Button>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              <h1 className="opacity-50 font-bold mt-6 mb-2">ADVANCED</h1>
              <p className="text-xs mb-1">Apply method</p>
              <Select
                value={steerApplyMethod}
                onValueChange={(s) => setSteerApplyMethod(s)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Apply method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System instruction</SelectItem>
                  <SelectItem value="posthistory">
                    Post-history user message
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="opacity-50 text-xs">
                {steerApplyMethod == "system"
                  ? "Injects the instructions on the FIRST system message at the top. More subtle but less effective on bigger chats."
                  : steerApplyMethod == "posthistory"
                    ? "Injects the instructions as a system message at the very bottom of the chat history. Applies steers more efficiently but may be too noticeable/quick."
                    : "idk lol"}
              </p>
            </div>
          </AnimateChangeInHeight>
        </MotionDialogContent>
      </Dialog>

      <Textarea
        id="Message"
        className={`w-full p-2 ${userPromptThinking ? "text-white/50" : ""} ${currentTheme.assistantBg} rounded-[27px] rounded-t-2xl pr-16 pl-4`}
        value={localMessage}
        onChange={handleInputChange}
        onKeyDown={(e) => localHandleSendMessage(e)}
        disabled={userPromptThinking}
      />

      <ContextMenu>
        <ContextMenuTrigger asChild>
          <Button
            className="absolute right-2 bottom-2 p-2 rounded-full"
            size="icon"
            onClick={handleButtonClick}
          >
            {isThinking || userPromptThinking ? (
              <OctagonX className="animate-pulse" />
            ) : (
              <Send />
            )}
          </Button>
        </ContextMenuTrigger>

        <ContextMenuContent className="w-64 font-sans font-semibold">
          <ContextMenuItem
            onClick={suggestReply}
            disabled={isThinking || userPromptThinking}
            asChild
          >
            <span className="flex items-center gap-2">
              <MessageSquareQuote className="h-4 w-4" />
              Suggest a reply
            </span>
          </ContextMenuItem>

          <ContextMenuItem
            onClick={() => {
              rewriteMessage(localMessageRef.current);
            }}
            disabled={isThinking || userPromptThinking}
            asChild
          >
            <span className="flex items-center gap-2">
              <PenLine className="h-4 w-4" />
              Rewrite message
            </span>
          </ContextMenuItem>

          <ContextMenuItem
            onClick={() => {
              setModalSteer(true);
            }}
            asChild
          >
            <span className="flex items-center gap-2">
              <ShipWheel className="h-4 w-4" />
              Manage Steering
            </span>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </div>
  );
};

export default MessageInput;
