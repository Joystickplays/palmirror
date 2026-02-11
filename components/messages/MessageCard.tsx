// components/MessageCard.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import ReactMarkdown from 'react-markdown';
import { Pencil, Rewind, Check, MessagesSquare, RotateCw, ChevronDown, MailQuestion, ArrowUp, X, Book  } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox"
import { useTheme } from '@/context/PalMirrorThemeProvider';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform, useDragControls, PanInfo, animate } from 'framer-motion';
import { CharacterData } from "@/types/CharacterData";
import { DomainFlashcardEntry } from '@/types/EEDomain';

import TypingIndication from "@/components/Typing"
import { useTypewriter } from '../utilities/Typewriter';
import { usePLMGlobalConfig } from '@/context/PLMGlobalConfig';
import { AnimateChangeInHeight } from '../utilities/animate/AnimateHeight';
import { AnimateChangeInSize } from '../utilities/animate/AnimateSize';
import { Label } from "@/components/ui/label"
import { PLMGlobalConfigServiceInstance } from '@/context/PLMGlobalConfigService';
import { Textarea } from '../ui/textarea';

const MarkdownView = React.memo(
  ({ content, className }: { content: string; className?: string }) => {
    return <ReactMarkdown className={className}>{content}</ReactMarkdown>;
  }
);

MarkdownView.displayName = "MarkdownView";


function fixEmphasisStyling(): void {

  const nestedEms = document.querySelectorAll<HTMLElement>(".markdown-content em em");
  nestedEms.forEach(innerEm => {
    const parentEm = innerEm.parentElement;

    if (parentEm && parentEm.tagName === 'EM') {

      const textNode = document.createTextNode(innerEm.textContent || "");

      parentEm.replaceChild(textNode, innerEm);
    }
  });

  const elements = document.querySelectorAll<HTMLElement>(".markdown-content em");
  elements.forEach(em => {
    const parent = em.parentElement;
    if (!parent) return;

    if (parent.nodeType !== Node.ELEMENT_NODE) return;

    const parentText = parent.textContent || "";
    const emText = em.textContent || "";

    if (!emText.trim()) return;

    let insideQuotes = false;
    const regex = /"([^"]*)"/g;
    let match;

    while ((match = regex.exec(parentText)) !== null) {
      if (match[1].includes(emText)) {

        const emStartIndexInParent = parentText.indexOf(emText);

        if (emStartIndexInParent !== -1) {

          if (emStartIndexInParent > match.index && (emStartIndexInParent + emText.length) < (match.index + match[0].length)) {
            insideQuotes = true;
            break;
          }
        }
      }
    }

    if (insideQuotes) {
      em.classList.add("no-newline");
    }
  });
}
interface MessageCardProps {
  index: number;
  extContIdx: number;
  content: string;
  reasoningContent?: string;
  role: string;
  stillGenerating: boolean;
  regenerateFunction: (options?: {
    rewriteBase?: string;
    recalledFlashcards?: Array<DomainFlashcardEntry>;
    recallDomainGuide?: boolean;
  }) => void;
  globalIsThinking: boolean;
  isGreetingMessage: boolean;
  isLastMessage: boolean;
  characterData: CharacterData;
  editMessage: (index: number, content: string, extContIdx?: number) => void;
  rewindTo: (index: number) => void;
  changeStatus: (changingStatus: string, changingStatusValue: string, changingStatusCharReacts: boolean, changingStatusReason: string) => void;
  messageListRef: React.RefObject<HTMLDivElement>;
  domainFlashcards: Array<DomainFlashcardEntry>;
  domainGuide: string;
  regenerationOptions?: {
    rewriteBase?: string;
    recalledFlashcards?: Array<DomainFlashcardEntry>;
    recallDomainGuide?: boolean;
  };
  changeRegenOptions: (options: {
    rewriteBase?: string;
    recalledFlashcards?: Array<DomainFlashcardEntry>;
    recallDomainGuide?: boolean;
  }) => void;
  configTyping: boolean;
  configHighend: boolean;
  configAutoCloseFormatting: boolean;
}

interface AlternateInitialMessage {
  name: string;
  initialMessage: string;
}

type StatusData = Array<{ key: string; value: string }>;


const vibrate = (duration: number) => {
  if ("vibrate" in navigator && PLMGlobalConfigServiceInstance.get("haptics")) {
    navigator.vibrate(duration);
  }
};

const MotionButton = motion(Button);


const MessageCard: React.FC<MessageCardProps> = ({
  index,
  extContIdx,
  content,
  reasoningContent,
  role,
  stillGenerating,
  regenerateFunction,
  globalIsThinking,
  isLastMessage,
  isGreetingMessage,
  characterData,
  editMessage,
  rewindTo,
  changeStatus,
  messageListRef,
  domainFlashcards,
  domainGuide,
  regenerationOptions,
  changeRegenOptions,
  configTyping,
  configHighend,
  configAutoCloseFormatting
}) => {

  // const PLMGC = usePLMGlobalConfig();
  // const [configHighend, setConfigHighend] = useState(false);
  // useEffect(() => {
  //   setConfigHighend(!!PLMGC.get("highend"))
  // }, [])

  const x = useMotionValue(0);
  const scale = useMotionValue(1);
  const height = useMotionValue(100);
  const fontSize = useMotionValue(1);
  const blur = useMotionValue(0);
  const xOffset = useMotionValue(0);

  const animatedScale = useSpring(scale, { stiffness: 200, damping: 15 });
  const animatedXOffset = useSpring(xOffset, { stiffness: 200, damping: 15 });
  const animatedHeight = useSpring(height, { stiffness: 600, damping: 30 });
  const animatedFontSize = useSpring(fontSize, { stiffness: 600, damping: 30 });
  const animatedBlur = useSpring(blur, { stiffness: 600, damping: 30 });
  const [dragStarted, setDragStarted] = useState(false);
  const dragControls = useDragControls();

  const heightTransform = useTransform(animatedHeight, h => `${h}%`);
  const fontSizeTransform = useTransform(animatedFontSize, s => `${s}rem`);
  const blurTransform = useTransform(animatedBlur, b => `blur(${b}px)`);
  const gapTransform = useTransform(animatedFontSize, s => `${s / 2}rem`);
  const marginTopTransform = useTransform(animatedFontSize, s => `${s / 2}rem`);
  const userNameFontSizeTransform = useTransform(animatedFontSize, s => `${s / 1.5}rem`);
  const cardPaddingTransform = useTransform(animatedFontSize, s => `${s / 2}rem`);
  const cardPaddingLeftTransform = useTransform(animatedFontSize, s => `${s}rem`);

  const overlayOpacity = useTransform(x, (val) => {
    const threshold = val > 0 ? 25 : 50;
    const absVal = Math.abs(val);
    return absVal > threshold ? Math.min((absVal - threshold) / threshold, 1) : 0;
  });
  const [overlayDir, setOverlayDir] = useState<"left" | "right">("left");

  let aboutToRegenerate = false;
  const [isEditing, setIsEditing] = useState(false);
  const [editingContent, setEditingContent] = useState('');
  const { theme, getTheme } = useTheme();
  const currentTheme = getTheme();
  const [statuses, setStatuses] = useState<StatusData>([]);
  const [invocationHolder, setInvocationHolder] = useState("");
  const [seenInvocations, setSeenInvocations] = useState<string[]>([]);
  const [imageInvocations, setImageInvocations] = useState<string[]>([]);

  const [changingStatus, setChangingStatus] = useState("");
  const [changingStatusValue, setChangingStatusValue] = useState("");
  const [changingStatusCharReacts, setChangingStatusCharReacts] = useState(false);
  const [changingStatusReason, setChangingStatusReason] = useState("");

  const [showAltDrawer, setShowAltDrawer] = useState(false);

  const [canRegenerate, setCanRegenerate] = useState(false);
  const [userAboutToRegen, setUserAboutToRegen] = useState(false);
  const [showRegenOptions, setShowRegenOptions] = useState(false);
  const [localRegenOptions, setLocalRegenOptions] = useState(regenerationOptions);

  const [showReasoning, setShowReasoning] = useState(true);
  const reasoningDivRef = useRef<HTMLDivElement>(null);

  const [typewrittenContent, setTypewrittenContent] = useState("");
  const messageTyped = useTypewriter(typewrittenContent, { speed: 5, inBatchesOf: 5 })

  const [presentableText, setPresentableText] = useState("");

  const triggerRegenerate = useCallback((options?: any) => {
    regenerateFunction(options);
  }, [regenerateFunction]);

  const startEditing = () => {
    setEditingContent(content);
    setIsEditing(true);
  }

  const isEligibleForRegenerate = !globalIsThinking && !stillGenerating && role !== "user" && !isEditing && isLastMessage;

  const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const currentX = x.get();
    
    const dragThreshold = -100;
    const isRegenerateAction = currentX < dragThreshold && isEligibleForRegenerate;
    
    setCanRegenerate(isEligibleForRegenerate);

    if (isRegenerateAction && !aboutToRegenerate) {
      aboutToRegenerate = true;
      setUserAboutToRegen(true);
      // console.log("Message card - regen vibrate...")
      //debugger;
    } else if (!isRegenerateAction) {
      aboutToRegenerate = false;
      setUserAboutToRegen(false);
    }

    if (currentX < 0) {
      if (overlayDir !== "left") {
        setOverlayDir("left");
      }
    } else {
      if (overlayDir !== "right") {
        setOverlayDir("right");
      }
    }

    scale.set(isRegenerateAction ? 0.95 : 1);
    xOffset.set(isRegenerateAction ? -50 : 0);

    if (configHighend) {
       const targetBlur = isRegenerateAction ? 4 : (isEligibleForRegenerate ? Math.abs(currentX) * 0.01 : 0);
       blur.set(targetBlur);
    }
  }

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const currentX = x.get();
      const dragThreshold = -100;
      
      const isFling = info.velocity.x < -500; 
      const isPastThreshold = currentX < dragThreshold;

      const isFlingForRegenOpts = info.velocity.x > 500;


      if ((isPastThreshold || isFling) && isEligibleForRegenerate) {
        animate(x, -500, { duration: 0.2 });
        animate(height, 0, { duration: 0.2 });
        animate(fontSize, 0, { duration: 0.2 });
        animate(blur, 30, { duration: 0.2 });
        
        setTimeout(triggerRegenerate, 250);
      } else {
        aboutToRegenerate = false;
        setUserAboutToRegen(false);
        scale.set(1);

        if (isFlingForRegenOpts && isEligibleForRegenerate) {
          setLocalRegenOptions(regenerationOptions);
          setShowRegenOptions(true);
          
          animate(x, 800, { 
            type: 'spring',
            velocity: info.velocity.x / 3,
            modifyTarget: () => 0,
            power: 0.1,
            bounceStiffness: 200,
            bounceDamping: 20
          });
          setDragStarted(false);
          return;
        }

        animate(x, 0, { 
          type: 'spring',
          velocity: info.velocity.x / 3,
          modifyTarget: () => 0,
          power: 0.1,
          bounceStiffness: 200,
          bounceDamping: 20
         });
        xOffset.set(0);
        blur.set(0);
      }
      setDragStarted(false);
  };

  const extractStatusData = (input: string): StatusData => {
    const statusRegex = /---\s*STATUS:\s*((?:.+?\s*[=:]\s*.+(?:\n|$))*)/i;
    const match = input.match(statusRegex);

    if (match && match[1]) {
      const keyValuePairs = match[1]
        .trim()
        .split('\n')
        .filter((line) => line.includes('=') || line.includes(':'));

      const data: StatusData = keyValuePairs.map((pair) => {
        const [key, ...valueParts] = pair.split(/[:=]/);
        return {
          key: key.trim(),
          value: valueParts.join('=').trim(),
        };
      });

      return data;
    }

    return [];
  };

  const removeStatusSection = (input: string): string => {
    const statusRegex = /---\s*STATUS:\s*((?:.+?\s*[=:]\s*.+(?:\n|$))*)/i;

    return input.replace(statusRegex, '').trim();
  };

  const invocationTagsDetection = (input: string): { foundStrings: string[], modifiedString: string } => {
    const regex = /`([^`]+)`/g;
    const foundStrings: string[] = [];
    let match;


    while ((match = regex.exec(input)) !== null) {
      foundStrings.push(`\`${match[1]}\``);
    }

    const modifiedString = input.replace(regex, '').trim();
    //console.log(foundStrings);
    return { foundStrings, modifiedString };
  };

  const phraseDetection = (input: string, phrases: string[]): { foundPhrases: string[], modifiedString2: string } => {
    const foundPhrases: string[] = [];
    let modifiedString2 = input;

    phrases.forEach(phrase => {
      const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
      if (regex.test(input)) {
        foundPhrases.push(`${phrase}`);
        modifiedString2 = modifiedString2.replace(regex, '').trim();
      }
    });

    return { foundPhrases, modifiedString2 };
  };

  const invocationProcessor = (triggers: Array<string>) => {
    const newTriggers = triggers.filter(trigger => !seenInvocations.includes(trigger));
    setSeenInvocations(prev => [...prev, ...newTriggers]);

    newTriggers.forEach((trigger) => {
      const foundInvocation = characterData.plmex.invocations.find((invocation) => invocation.trigger === trigger || invocation.trigger === `=${trigger}=`);
      if (foundInvocation) {
        if (foundInvocation.type === "sound") {
          const audio = new Audio(foundInvocation.data);
          audio.play();
        } else if (foundInvocation.type === "image" && !imageInvocations.includes(foundInvocation.data)) {
          setImageInvocations(prev => { return Array.from(new Set([...prev, foundInvocation.data])) });
        }
      }
    });
  };

  const filterInvocationTags = (content: string) => {
    const { foundStrings, modifiedString } = invocationTagsDetection(content);
    return modifiedString
  }

  const cleanAllTags = (message: string): string => {
    return message.replace(/<ATR_CHANGE\s+[^>]+>/gi, "").replace(/<NEW_MEMORY\s+[^>]+>/g, "").replace(/<TIMESTEP\s+[^>]+>/g, "").trim();
  };

  const closeStars = (str: string) => {
    let starOpen = false;
    let result = "";

    for (const c of str) {
      if (c === '*') {
        starOpen = !starOpen;
      }
      result += c;
    }

    result = result.trim();
    if (starOpen) result += '*';

    return result;
  }

  const closeQuotes = (str: string) => {
    let quoteOpen = false;
    let result = "";

    for (const c of str) {
      if (c === '"') {
        quoteOpen = !quoteOpen;
      }
      result += c;
    }

    result = result.trim();
    if (quoteOpen) result += '"';

    return result;
  }

  const processContent = (raw: string, usingInvocationHolder: boolean = true) => {
    let processedContent = raw;
    try {
      if (usingInvocationHolder && characterData.plmex.invocations.length > 0) {
        processedContent = filterInvocationTags(processedContent);
      }
      processedContent = processedContent
        .replace(/\{\{user\}\}/g, characterData.userName || "Y/N")
        .replace(/\{\{char\}\}/g, characterData.name || "C/N");

      processedContent = removeStatusSection(processedContent);
      processedContent = cleanAllTags(processedContent);
    } catch (e) {
      console.log("Text processing failed; using raw content", e);
    }
    // processedContent = closeStars(processedContent);
    // processedContent = closeQuotes(processedContent);

    return processedContent;
  };


  const rpTextRender = (content: string, usingInvocationHolder: boolean = true, typewrite = true) => {
    let processedContent = content

    try {
      if (usingInvocationHolder && characterData.plmex.invocations.length > 0) {
        processedContent = filterInvocationTags(content)
      }
      processedContent = processedContent.replace(/\{\{user\}\}/g, characterData.userName || "Y/N").replace(/\{\{char\}\}/g, characterData.name || "C/N")

      processedContent = removeStatusSection(processedContent)
      processedContent = cleanAllTags(processedContent)
    } catch (e) { console.log("Text rendering failed; proceeding with raw"); console.log(e); }

    if (typewrite && configTyping) {
      setTypewrittenContent(processedContent)
    }
    setPresentableText(processedContent)
    return processedContent
  }

  useEffect(() => {
    document.body.style.removeProperty("pointer-events");
  }, [showAltDrawer])

  useEffect(() => {
    const processed = processContent(content);

    if (configTyping) {
      setTypewrittenContent(processed);
    }
    setPresentableText(processed);

    if (reasoningContent !== "" && content !== "" && showReasoning) {
      setShowReasoning(false);
    }

    try {
      setStatuses(extractStatusData(content));
      if (characterData.plmex.invocations.length > 0) {
        const { foundStrings, modifiedString } = invocationTagsDetection(content);
        const { foundPhrases, modifiedString2 } = phraseDetection(modifiedString, characterData.plmex.invocations.map(invocation => invocation.trigger));
        setInvocationHolder(prev => {
          const newInvocationHolder = prev === "" ? modifiedString2 : prev;
          const newInvocations = [...foundStrings, ...foundPhrases].filter(trigger => !prev.includes(trigger));
          invocationProcessor(newInvocations);
          return newInvocationHolder;
        });
      }
    } catch (e) { console.log(e) }
  }, [content])

  useEffect(() => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
      fixEmphasisStyling();
    }
  }, [messageTyped])

  useEffect(() => {
    if (reasoningContent && reasoningDivRef.current) {
      reasoningDivRef.current.scrollTop = reasoningDivRef.current?.scrollHeight;
    }
  }, [reasoningContent])

  // useEffect(() => {
  //   if (!stillGenerating) {
  //     setShowReasoning(false);
  //   }
  // }, [stillGenerating])

  useEffect(() => {
    fixEmphasisStyling()
    // setInterval(() => {
    // }, 1000)

  }, [presentableText])

  useEffect(() => {
    if (role === "user" && isLastMessage && messageListRef.current) {
      const scrollDuration = 500;
      const startTime = Date.now();
      let reqId: number;

      const performScroll = () => {
        if (messageListRef.current) {
          messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
        }

        if (Date.now() - startTime < scrollDuration) {
          reqId = requestAnimationFrame(performScroll);
        }
      };

      reqId = requestAnimationFrame(performScroll);

      return () => cancelAnimationFrame(reqId);
    }
  }, [presentableText, role, isLastMessage, messageListRef]) // because of more race conditions and scary stuff, this ugly little ass will do


  useEffect(() => {
    if (userAboutToRegen) {
      vibrate(50);
    }
  }, [userAboutToRegen])  

  useEffect(() => {
    if (!showRegenOptions) {
      animate(x, 0);
    }
  }, [showRegenOptions])



  const renderContent = () => {
    if (isEditing) {
      return (
        <div className="flex flex-col gap-2 items-end">
          <Button onClick={() => {
            editMessage(index, editingContent, extContIdx);
            setInvocationHolder("");
            setIsEditing(false);
          }}>
            <span className="flex items-center gap-2">
              <Check className="h-4 w-4 text-black" />
              Done
            </span>
          </Button>
          <textarea
            className="bg-transparent resize-none border rounded-xl w-full h-52 p-3"
            value={editingContent}
            onChange={(e) => setEditingContent(e.target.value)}
          />
        </div>
      );
    }

    return (
      <div>
        {stillGenerating && content.length === 0 && (!reasoningContent || reasoningContent.length === 0)? (
          <TypingIndication />
        ) : (
          <>
            {reasoningContent && (
              <AnimateChangeInHeight className="border border-white/10 rounded-xl mb-4 font-sans">
                <div className="p-4 flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <motion.div
                      animate={{
                        rotate: showReasoning ? '0deg' : '180deg'
                      }}
                      className="w-6 h-6">
                      <Button onClick={() => { setShowReasoning(!showReasoning); console.log("e") }} size="icon" variant="ghost" className="w-6 h-6">
                        <ChevronDown />
                      </Button>
                    </motion.div>
                    <p className="italic font-bold text-sm opacity-25 text-end w-full tracking-wider">Thinking</p>
                  </div>
                  <AnimatePresence mode="popLayout">
                    {showReasoning && (
                      <motion.div
                        className="max-h-[100px] overflow-y-auto flex flex-col"
                        style={{
                          maskImage: stillGenerating ? 'linear-gradient(transparent, black 80%, black)' : "",
                        }}
                        ref={reasoningDivRef}
                        initial={{ y: -10, scale: 0.9, opacity: 0, filter: 'blur(5px)' }}
                        animate={{ y: 0, scale: 1, opacity: 1, filter: 'blur(0px)' }}
                        exit={{ y: -10, scale: 0.9, opacity: 0, filter: 'blur(5px)' }}
                        transition={{ type: 'spring', mass: 1, stiffness: 160, damping: 16 }}
                      >
                        <div className="mt-auto">
                          <div className="italic font-light opacity-50">
                            {reasoningContent}
                          </div>
                        </div>
                      </motion.div>

                    )}
                  </AnimatePresence>
                </div>
              </AnimateChangeInHeight>
            )}

            <MarkdownView
              className={`${stillGenerating ? "shimmer-content-wrapper" : ""} select-none opacity-95 markdown-content`}
              content={
                configAutoCloseFormatting ? 
                closeStars(closeQuotes(configTyping ? messageTyped : presentableText))
                : configTyping ? messageTyped : presentableText
              }
            />

            {content === "" && !stillGenerating && (
              <div className="border border-white/10 rounded-xl p-2 px-4 text-white/50 text-sm">
                <MailQuestion className="mx-auto my-2" />
                <p>{`Hmm, this message doesn't contain any text.`}</p>
                <Button onClick={() => regenerateFunction()} className="my-2 mt-4 ml-auto block" variant="outline">Regenerate</Button>
              </div>
            )}

          </>
        )}

        {imageInvocations.length > 0 && (
          <div className="flex gap-4">
            {imageInvocations.map((src, idx) => (
              <img key={idx} src={src} alt={`Invocation ${idx}`} className="rounded-lg w-48 h-48 object-cover" />
            ))}
          </div>
        )}

        {statuses.length > 0 && (
          <motion.div key="idkwhatyouwant" style={{ marginTop: fontSizeTransform }} className="flex gap-2 overflow-x-auto">
            {statuses.map((status) => (
              <AnimatePresence key={status.key} mode="popLayout">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button disabled={!isLastMessage} size="sm" variant="outline" className="text-xs" onClick={() => {
                      setChangingStatus(status.key);
                      setChangingStatusValue(status.value);
                      setChangingStatusCharReacts(false);
                      setChangingStatusReason("");
                    }} scaleOnPress={false}>
                      {status.key}: <span className="opacity-50">{status.value}</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="font-sans!">
                    <DialogHeader>
                      <DialogTitle>Change this dynamic status</DialogTitle>
                    </DialogHeader>
                      <AnimateChangeInHeight>
                        <AnimatePresence mode="popLayout">
                          <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1">
                              <p className="text-sm">{changingStatus}</p>
                              <Input onChange={(e) => setChangingStatusValue(e.target.value)} value={changingStatusValue} />
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              <Checkbox
                                id="react"
                                checked={changingStatusCharReacts}
                                onCheckedChange={(checked) => setChangingStatusCharReacts(checked === true)}
                              />
                              <Label htmlFor="react">Have {characterData.name} react to the change?</Label>
                            </div>
                            {changingStatusCharReacts && (
                              <motion.textarea
                                key="textarea"
                                className="bg-transparent resize-none border rounded-xl w-full h-20 p-3 mt-2 origin-top-left"
                                placeholder="Reason for change"
                                value={changingStatusReason}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setChangingStatusReason(e.target.value)}
                                initial={{ opacity: 0, scale: 0.95, y: -70 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0 }}
                                transition={{ type: 'spring', mass: 1, stiffness: 160, damping: 17,
                                  y: { type: 'spring', mass: 1, stiffness: 240, damping: 20 }
                                }}
                              />
                            )}
                          </div>
                        </AnimatePresence>
                      </AnimateChangeInHeight>
                      
                      <DialogClose asChild>
                        <Button onClick={() => {
                          changeStatus(changingStatus, changingStatusValue, changingStatusCharReacts, changingStatusReason);
                        }}>
                          {changingStatusCharReacts ? "Save & react" : "Save"}
                        </Button>
                      </DialogClose>
                  </DialogContent>
                </Dialog>
              </AnimatePresence>
            ))}

          </motion.div>
        )}
      </div>
    );
  };

  return (
    <div className="relative w-full h-full">
      <div className="relative w-full h-full pb-4">
      <AnimatePresence mode="popLayout">
        {showRegenOptions && (
          <motion.div
          initial={{
            x: -500,
            opacity: 0
          }}
          animate={{
            x: 0,
            opacity: 1
          }}
          exit={{
            x: -500,
            opacity: 0
          }}
          transition={{ type: 'spring', mass: 1, stiffness: 160, damping: 16 }}
          className={`${!showRegenOptions && "absolute"} mt-4 flex top-0 left-0 w-full h-full`}>
              <div className="flex flex-col gap-1 w-full border border-white/10 rounded-xl p-4">
                <h1 className="font-extrabold text-xl">Rewrite Options</h1>
                <p className="opacity-75 text-sm mb-4">Influence how future rewrites in this message are made</p>
                <Textarea
                value={localRegenOptions?.rewriteBase || ""}
                onChange={(e) => {
                  setLocalRegenOptions({
                    ...localRegenOptions,
                    rewriteBase: e.target.value
                  })
                }}
                placeholder='Information on how to write this message'></Textarea>
                {domainFlashcards.length > 0 && (
                  <div className="mt-4 flex flex-col gap-2">
                    <Label className="text-xs opacity-70">Flashcard Recalls</Label>
                    <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-2">
                      {domainFlashcards.map((flashcard) => {
                        const isSelected = localRegenOptions?.recalledFlashcards?.some(f => f.content === flashcard.content);
                        return (
                          <div key={flashcard.content} className="flex items-center justify-between p-2 px-4 rounded-lg border border-white/5">
                            <div className="flex flex-col overflow-hidden">
                              <span className="text-sm truncate">{flashcard.content}</span>
                            </div>
                            <div className="flex">
                              <Button 
                              onClick={() => {
                                if (isSelected) {
                                  setLocalRegenOptions({
                                    ...localRegenOptions,
                                    recalledFlashcards: localRegenOptions?.recalledFlashcards?.filter(f => f.content !== flashcard.content)
                                  });
                                }
                              }}
                              variant="outline" className={`w-8 h-8 p-0 rounded-r-none ${isSelected ? "opacity-50" : ""}`}>
                                <X className="text-red-400" />
                              </Button>
                              <Button
                              onClick={() => {
                                if (!isSelected) {
                                  setLocalRegenOptions({
                                    ...localRegenOptions,
                                    recalledFlashcards: [...(localRegenOptions?.recalledFlashcards || []), flashcard]
                                  });
                                }
                              }}
                              variant="outline" className={`w-8 h-8 p-0 rounded-l-none ${!isSelected ? "opacity-50" : ""}`}>
                                <Check className="text-green-400" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {domainGuide !== "" && (
                  <div className="mt-4 flex flex-col gap-2">
                    <Label className="text-xs opacity-70">Domain Guide Recall</Label>
                    <div className="flex items-center justify-between p-2 px-4 rounded-lg border border-white/5">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <Book className="w-6 h-6 opacity-80" />
                        <span className="text-sm truncate">{`Recall the domain guide in future rewrites`}</span>
                      </div>
                      <div className="flex">
                        <Button
                          onClick={() => {
                            setLocalRegenOptions({
                              ...localRegenOptions,
                              recallDomainGuide: false
                            });
                          }}
                          variant="outline" className={`w-8 h-8 p-0 rounded-r-none ${localRegenOptions?.recallDomainGuide ? "opacity-50" : ""}`}>
                          <X className="text-red-400" />
                        </Button>
                        <Button
                          onClick={() => {
                            setLocalRegenOptions({
                              ...localRegenOptions,
                              recallDomainGuide: true
                            });
                          }}
                          variant="outline" className={`w-8 h-8 p-0 rounded-l-none ${!localRegenOptions?.recallDomainGuide ? "opacity-50" : ""}`}>
                          <Check className="text-green-400" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex justify-end gap-2 mt-2">
                  <Button variant={"outline"} onClick={() => {
                    changeRegenOptions(localRegenOptions || {});
                    setShowRegenOptions(false);
                  }}>Back</Button>
                  <Button onClick={() => {
                    changeRegenOptions(localRegenOptions || {});
                    setShowRegenOptions(false);
                    triggerRegenerate(localRegenOptions);
                  }}>Rewrite now</Button>
                </div>
              </div>
          </motion.div>
        )}
      </AnimatePresence>
    <motion.div
      drag="x"
      dragControls={dragControls}
      dragListener={false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={isEligibleForRegenerate ? { left: 0.7, right: 0.3 } : { left: 0.05, right: 0.05 }}
      onDragStart={() => setDragStarted(true)}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      style={{
        x,
        y: 0,
        scale: animatedScale,
        height: heightTransform,
        fontSize: fontSizeTransform,
        filter: blurTransform,
        gap: gapTransform,
        marginTop: marginTopTransform
      }}
      className={`flex flex-col justify-end min-h-full overflow-hidden ${showRegenOptions ? "absolute top-0 left-0" : "relative"}`}
    >
      <motion.p className={`${role === "user" ? "ml-auto" : "mr-auto"} opacity-50`} style={{ fontSize: userNameFontSizeTransform, x: animatedXOffset }}>
        {role === "user" ? `${currentTheme.showUserName ? characterData.userName || "Y/N" : ""}` : characterData.name || "Character"}
      </motion.p>
      <Drawer open={showAltDrawer} onOpenChange={(open) => { setShowAltDrawer(open) }} >
        <DrawerContent className="w-auto max-w-[750px] min-w-[50vw] font-sans overflow-y-visible">
          <div className="max-h-[80vh] overflow-y-auto">
            <div>
              <DrawerHeader>
                <DrawerTitle className="mb-2 text-center">Choose an alternate initial message</DrawerTitle>
                {/* <Select>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose an alternate initial message" />
              </SelectTrigger>
              <SelectContent> */}
                <p className="opacity-75 text-xs mb-8 palmirror-exc-text text-center font-normal!">Swipe left to generate a new initial message!</p>
                {characterData.alternateInitialMessages && [...(characterData.alternateInitialMessages)].map((message: AlternateInitialMessage | string, index) => {
                  message = typeof message == "string" ? message : message?.initialMessage ?? "";
                  return (
                    <Card key={message} className="mb-4 p-3 text-left">
                      <CardContent>
                        <ReactMarkdown className="markdown-content">
                          {processContent(message, true)}
                        </ReactMarkdown>
                        <DrawerClose asChild>
                          <Button onClick={() => {
                            editMessage(0, message);
                            setInvocationHolder("");
                            setImageInvocations([]);
                            setSeenInvocations([]);
                            setIsEditing(false);
                          }} className="mt-5 w-full">Use</Button>
                        </DrawerClose>
                      </CardContent>
                    </Card>
                  );
                })}
                {/* </SelectContent>
            </Select> */}
              </DrawerHeader>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
      
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <motion.div style={{ x: animatedXOffset }}>
            <Card
              onPointerDown={(e) => dragControls.start(e)}
              className={`rounded-xl sm:max-w-xl max-w-full w-fit border-0 grow-0 shrink h-fit touch-pan-y ${role === "user"
                ? `${currentTheme.userBg} ml-auto rounded-br-md text-end`
                : `${currentTheme.assistantBg} mr-auto rounded-bl-md`
                } ${isEditing ? "w-full" : ""}`}
            >
              <CardContent className="p-0">
                <motion.div className="whitespace-pre-line wrap-break-word max-w-full markdown-content overflow-hidden" style={{
                  padding: cardPaddingTransform,
                  paddingLeft: cardPaddingLeftTransform,
                  paddingRight: cardPaddingLeftTransform,
                }}>
                  {renderContent()}
                </motion.div>
              </CardContent>
              {!configHighend && (
                <motion.div className={`absolute inset-0 flex items-end ${overlayDir === "right" ? "justify-start" : "justify-end"} z-10 text-white bg-opacity-0 pointer-events-none select-none`}
                  style={{
                    opacity: overlayOpacity
                  }}>

                  <AnimateChangeInSize className="bg-black/50 rounded-2xl">
                    <div className="flex gap-2 p-2 whitespace-nowrap">
                      {overlayDir === "left" ? (
                        <><RotateCw className="animate-[spin_2s_infinite] min-w-6" /><p>
                          <AnimatePresence mode="popLayout">
                            {userAboutToRegen ? (
                              <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ type: 'spring', mass: 1, stiffness: 160, damping: 16 }}
                                key="gonnaRegen">
                                Release
                              </motion.span>
                            ) : (
                              <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ type: 'spring', mass: 1, stiffness: 160, damping: 16 }}
                                key="howtoRegen">
                                Swipe left
                              </motion.span>
                            )}
                          </AnimatePresence>
                          {" "}to rewrite...</p></>
                      ): (
                          isEligibleForRegenerate && (
                          <>
                            <p>
                              Swipe right for rewrite options...</p>
                            <ArrowUp className="animate-[bounce_2s_infinite] min-w-6 rotate-90 -scale-x-100" />
                          </>
                          )
                      )}
                    </div>
                  </AnimateChangeInSize>
                </motion.div>
              )}
            </Card>
          </motion.div>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-64 font-sans font-semibold">
          {isGreetingMessage && characterData.alternateInitialMessages && (
            <ContextMenuItem onClick={() => setShowAltDrawer(true)} asChild>
              <span className="flex items-center gap-2">
                <MessagesSquare className="h-4 w-4" />
                Choose an alternate initial message
              </span>
            </ContextMenuItem>


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

    </motion.div >
    </div>
    </div>
  );
};

export default MessageCard;
