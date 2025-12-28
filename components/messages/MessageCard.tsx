// components/MessageCard.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import ReactMarkdown from 'react-markdown';
import { useSpring, animated } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';
import { Pencil, Rewind, Check, MessagesSquare, RotateCw, ChevronDown, MailQuestion } from 'lucide-react';
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
import { AnimatePresence, motion } from 'framer-motion';
import { CharacterData } from "@/types/CharacterData";

import TypingIndication from "@/components/Typing"
import { useTypewriter } from '../utilities/Typewriter';
import { usePLMGlobalConfig } from '@/context/PLMGlobalConfig';
import { AnimateChangeInHeight } from '../utilities/animate/AnimateHeight';
import { AnimateChangeInSize } from '../utilities/animate/AnimateSize';
import { Label } from "@/components/ui/label"

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
  regenerateFunction: () => void;
  globalIsThinking: boolean;
  isGreetingMessage: boolean;
  isLastMessage: boolean;
  characterData: CharacterData;
  editMessage: (index: number, content: string, extContIdx?: number) => void;
  rewindTo: (index: number) => void;
  changeStatus: (changingStatus: string, changingStatusValue: string, changingStatusCharReacts: boolean, changingStatusReason: string) => void;
  messageListRef: React.RefObject<HTMLDivElement>;
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
  if ("vibrate" in navigator) {
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
  configTyping,
  configHighend,
  configAutoCloseFormatting
}) => {

  // const PLMGC = usePLMGlobalConfig();
  // const [configHighend, setConfigHighend] = useState(false);
  // useEffect(() => {
  //   setConfigHighend(!!PLMGC.get("highend"))
  // }, [])

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

  const [showReasoning, setShowReasoning] = useState(true);
  const reasoningDivRef = useRef<HTMLDivElement>(null);

  const [typewrittenContent, setTypewrittenContent] = useState("");
  const messageTyped = useTypewriter(typewrittenContent, { speed: 5, inBatchesOf: 5 })

  const [presentableText, setPresentableText] = useState("");

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
    setCanRegenerate(isEligibleForRegenerate)
    if (isRegenerateAction && !aboutToRegenerate) {
      aboutToRegenerate = true;
      setUserAboutToRegen(true);
      // console.log("Message card - regen vibrate...")
      //debugger;
    } else if (!isRegenerateAction) {
      aboutToRegenerate = false;
      setUserAboutToRegen(false);
    }

    apiSpring.start({
      x: down
        ? (0.75 * mx) / (role === "user" || stillGenerating || !isLastMessage || globalIsThinking || isEditing || mx > 0 ? 10 : 1) + (isRegenerateAction ? -50 : 0)
        : 0,
      y: 0,
      height: 100,
      blur: configHighend ? (isRegenerateAction ? 4 : (down && canRegenerate ? 0.01 * -mx : 0)) : 0,
      fontSize: 1,
      config: { tension: 190, friction: 18 },
    });

    apiScaleSpring.start({
      scale: down ? (isRegenerateAction ? 0.95 : 1) : 1,
    });

    if (((vx > 2 && mx < 0) || mx < dragThreshold) && !down && isEligibleForRegenerate) {
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
  }, { axis: "x" });

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
    if (userAboutToRegen) {
      vibrate(50);
    }
  }, [userAboutToRegen])  


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
                <Button onClick={regenerateFunction} className="my-2 mt-4 ml-auto block" variant="outline">Regenerate</Button>
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
          <animated.div key="idkwhatyouwant" style={{ marginTop: fontSize.to(s => `${s}rem`) }} className="flex gap-2 overflow-x-auto">
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
                                initial={{ opacity: 0, scale: 0.8, y: -70 }}
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

          </animated.div>
        )}
      </div>
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
        {role === "user" ? `${currentTheme.showUserName ? characterData.userName || "Y/N" : ""}` : characterData.name || "Character"}
      </animated.p>
      <Drawer open={showAltDrawer} onOpenChange={(open) => { setShowAltDrawer(open) }} > {/* Alternate messages Drawer */}
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
          <div>
            <Card
              {...bind()}
              className={`rounded-xl sm:max-w-lg max-w-full w-fit border-0 grow-0 shrink h-fit touch-pan-y ${role === "user"
                ? `${currentTheme.userBg} ml-auto rounded-br-md text-end`
                : `${currentTheme.assistantBg} mr-auto rounded-bl-md`
                } ${isEditing ? "w-full" : ""}`}
            >
              <CardContent className="p-0">
                <animated.div className="whitespace-pre-line wrap-break-word max-w-full markdown-content overflow-hidden" style={{
                  padding: fontSize.to(s => `${s / 2}rem`),
                  paddingLeft: fontSize.to(s => `${s}rem`),
                  paddingRight: fontSize.to(s => `${s}rem`),
                }}>
                  {renderContent()}
                  {/* Swipe to regenerate overlay */}
                </animated.div>
              </CardContent>
              {!configHighend && (
                <animated.div className="absolute inset-0 flex items-end justify-end z-10 text-white bg-opacity-0 pointer-events-none select-none"
                  style={{
                    opacity: canRegenerate ? x.to(val => -val / 100) : x.to(() => 0)
                  }}>

                  <AnimateChangeInSize className="bg-black/50 rounded-2xl">
                    <div className="flex gap-2 p-2 whitespace-nowrap">
                      <RotateCw className="animate-[spin_2s_infinite] min-w-6" />
                      <p>
                        <AnimatePresence mode="popLayout">
                          {
                            userAboutToRegen ? (
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
                            )
                          }
                        </AnimatePresence>
                        {" "}to rewrite...</p>
                    </div>
                  </AnimateChangeInSize>
                </animated.div>
              )}
            </Card>
            {/* <AnimatePresence>
            {!globalIsThinking && isLastMessage && role === "assistant" && !isEditing && (
              <motion.div
              variants={toolbarVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              layout
              className="flex flex-row gap-1 w-full mt-1 px-1 origin-top-left">
                <MotionButton onClick={triggerRegenerate} variants={toolItemVariants} variant="outline" size="icon" className="p-2 px-1 border  rounded-lg"><RotateCw className="h-3 opacity-50" /></MotionButton>    
                <MotionButton onClick=startEditing} variants={toolItemVariants} variant="outline" size="icon" className="p-2 px-1 border  rounded-lg"><Pencil className="h-3 opacity-50" /></MotionButton>    
              </motion.div>
              )}
            </AnimatePresence> */}
          </div>
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

    </animated.div >
  );
};

export default MessageCard;
