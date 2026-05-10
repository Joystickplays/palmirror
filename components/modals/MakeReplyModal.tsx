"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
  FastForward,
  MessageSquareQuote
} from "lucide-react";
import { Textarea } from "../ui/textarea";

interface MakeReplyModalProps {
  modalState: boolean;
  setModalState: React.Dispatch<React.SetStateAction<boolean>>;
  MakeReplyCallback: (scene: string) => void;
}

const MakeReplyModal: React.FC<MakeReplyModalProps> = ({
  modalState,
  setModalState,
  MakeReplyCallback,
}) => {
  const [makeReply, setMakeReply] = useState(typeof window !== "undefined" ? sessionStorage.getItem("arbitrarySuggestionInput") || "" : "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (modalState) {
      const timeout = setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
      return () => clearTimeout(timeout);
    }
    let attempts = 0;
    const id = setInterval(() => {
      document.body.style.pointerEvents = "auto";
      if (++attempts >= 10) clearInterval(id);
    }, 200);
    return () => clearInterval(id);
  }, [modalState]);
  // for EVERY modal.
  return (
    <Drawer open={modalState} onOpenChange={setModalState} repositionInputs={false}>
      <DrawerContent className="flex flex-col gap-2 items-center px-6 pb-4 w-full font-sans">
        <div className="flex gap-3 items-center my-6 mb-3">
        <MessageSquareQuote className="w-6 h-6"/>
          <DrawerTitle className="text-2xl">Reply from prompt</DrawerTitle>
        </div>
        <p className="opacity-75 text-xs italic mb-2 max-w-[20rem] text-center">Create a reply based on the prompt.</p>
        <p className="opacity-50 text-[10px] sm:text-xs flex gap-1 sm:gap-6">Recommended to write in first person<span>·</span>Leave blank for freeform</p>
        <div className="flex flex-col gap-2 w-full">
          <Textarea ref={textareaRef} value={makeReply} onChange={(e) => {setMakeReply(e.target.value)}} placeholder={"i ask to hold hands"} />
          <Button onClick={() => {setModalState(false); sessionStorage.setItem("arbitrarySuggestionInput", makeReply); MakeReplyCallback(makeReply);}}>Create reply</Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default MakeReplyModal;