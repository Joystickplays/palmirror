// components/MessageCard.tsx
import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import ReactMarkdown from 'react-markdown';
import { useSpring, animated } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';
import { Pencil, Rewind, Check, MessagesSquare, RotateCw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox"
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
  content: string;
  role: string;
  stillGenerating: boolean;
  regenerateFunction: () => void;
  globalIsThinking: boolean;
  isGreetingMessage: boolean;
  isLastMessage: boolean;
  characterData: CharacterData;
  editMessage: (index: number, content: string) => void;
  rewindTo: (index: number) => void;
  changeStatus: (changingStatus: string, changingStatusValue: string, changingStatusCharReacts: boolean, changingStatusReason: string) => void;
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
  changeStatus,
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
      vibrate(50);
      console.log("Message card - regen vibrate...")
      //debugger;
    } else if (!isRegenerateAction) {
      aboutToRegenerate = false;
    }

    apiSpring.start({
      x: down
        ? (0.75 * mx) / (role === "user" || stillGenerating || !isLastMessage || globalIsThinking || isEditing || mx > 0 ? 10 : 1) + (isRegenerateAction ? -50 : 0)
        : 0,
      y: 0,
      height: 100,
      blur: isRegenerateAction ? 2 : 0,
      fontSize: 1,
      config: { tension: 190, friction: 18 },
    });

    apiScaleSpring.start({
      scale: down ? (isRegenerateAction ? 0.8 : 0.95) : 1,
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
          setImageInvocations(prev => { return Array.from(new Set([...prev, foundInvocation.data]))});
        }
      }
    });
  };

  const filterInvocationTags = (content: string) => {
    const { foundStrings, modifiedString } = invocationTagsDetection(content);
    return modifiedString
  }

  const rpTextRender = (content: string, usingInvocationHolder: boolean = true) => {
    let processedContent = content

    try {
    if (usingInvocationHolder && characterData.plmex.invocations.length > 0) {
      processedContent = filterInvocationTags(content)
    }
    processedContent = processedContent.replace(/\{\{user\}\}/g, characterData.userName || "Y/N").replace(/\{\{char\}\}/g, characterData.name || "C/N")

    processedContent = removeStatusSection(processedContent)
    } catch (e) { console.log("Text rendering failed; proceeding with raw"); console.log(e); }
    
    return processedContent
  }

  useEffect(() => {
    document.body.style.removeProperty("pointer-events");
  }, [showAltDrawer])
 
  useEffect(() => {
    fixEmphasisStyling();
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

  const toolbarVariants = {
    hidden: { opacity: 0, scale: 0, height: 0 },
    visible: {
      opacity: 1,
      scale: 1,
      height: "auto",
      transition: {
        staggerChildren: 0.3,
        type: 'spring',
        mass: 1,
        stiffness: 251,
        damping: 22,
      },
    },
  };

  const toolItemVariants = {
    hidden: { opacity: 0, scale: 0 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: 'spring',
        mass: 1,
        stiffness: 251,
        damping: 22,
        duration: 0.5,
        delay: index,
      },
    },
  };


  const renderContent = () => {
    if (isEditing) {
      return (
        <div className="flex flex-col gap-2 items-end">
          <Button onClick={() => {
            editMessage(index, editingContent);
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
        {stillGenerating && content.length < 1 ? (
          <TypingIndication />
        ) : (
          <ReactMarkdown className={`${stillGenerating ? "animate-pulse" : ""} select-none opacity-95`}>
            {rpTextRender(content)}
          </ReactMarkdown>
        )}

        {imageInvocations.length > 0 && (
          <div className="flex gap-4">
            {imageInvocations.map((src, idx) => (
              <img key={idx} src={src} alt={`Invocation ${idx}`} className="rounded-lg w-48 h-48 object-cover saturate-0 blur-md scale-90 hover:saturate-100 hover:blur-none hover:scale-100 transition-all" />
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
                    }}>
                      {status.key}: <span className="opacity-50">{status.value}</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Change this dynamic status</DialogTitle>

                      <div className="flex flex-col gap-4 !mt-4">
                        <div className="flex flex-col gap-1">
                          <p className="text-sm">{changingStatus}</p>
                          <Input onChange={(e) => setChangingStatusValue(e.target.value)} value={changingStatusValue} />
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={changingStatusCharReacts}
                            onCheckedChange={(checked) => setChangingStatusCharReacts(checked === true)}
                          />
                          <p>Have {characterData.name} react to the change?</p>
                        </div>
                        {changingStatusCharReacts && (
                          <motion.textarea
                            className="bg-transparent resize-none border rounded-xl w-full h-20 p-3 mt-2"
                            placeholder="Reason for change"
                            value={changingStatusReason}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setChangingStatusReason(e.target.value)}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0 }}
                          />
                        )}
                      </div>
                      <DialogClose asChild>
                        <Button onClick={() => {
                          changeStatus(changingStatus, changingStatusValue, changingStatusCharReacts, changingStatusReason);
                        }}>Save</Button>
                      </DialogClose>
                    </DialogHeader>
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
      <Drawer  open={showAltDrawer}  onOpenChange={(open) => { setShowAltDrawer(open) }} > {/* Alternate messages Drawer */}
         <DrawerContent className="w-auto max-w-[100vw] min-w-[90vw] font-sans overflow-y-visible">
          <div className="max-h-[80vh] overflow-y-auto">
          <div>
          <DrawerHeader>
            <DrawerTitle className="mb-8">Choose an alternate initial message</DrawerTitle>
            {/* <Select>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose an alternate initial message" />
              </SelectTrigger>
              <SelectContent> */}
            {characterData.alternateInitialMessages && [...(characterData.alternateInitialMessages)].map((message: AlternateInitialMessage | string, index) => {
              message = typeof message == "string" ? message : message?.initialMessage ?? "";
              return (
                <Card key={message} className="mb-4 p-3 text-left">
                  <CardContent>
                    <ReactMarkdown className="markdown-content">
                      {rpTextRender(message)}
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
                <animated.div className="whitespace-pre-line break-words max-w-full markdown-content overflow-hidden" style={{
                  padding: fontSize.to(s => `${s / 2}rem`),
                  paddingLeft: fontSize.to(s => `${s}rem`),
                  paddingRight: fontSize.to(s => `${s}rem`),
                }}>
                  {renderContent()}
                  {/* Swipe to regenerate overlay */}
                  <animated.div className="absolute inset-0 bg-black flex gap-2 items-end justify-end z-10 text-white bg-opacity-50 pointer-events-none select-none"
                   style={{
                     opacity: canRegenerate ? x.to(val => -val / 100) : 0
                   }}>
                   
                   <RotateCw className="animate-[spin_2s_infinite]" />
                   <p>Swipe left to rewrite...</p>
                  </animated.div>
                </animated.div>
              </CardContent>
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
