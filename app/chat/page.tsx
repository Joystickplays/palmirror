"use client";

import { useState, useEffect, useRef, useContext } from "react";
import React from "react";
import MessageCard from "@/components/messages/MessageCard";
import ChatHeader from "@/components/chat/ChatHeader";
import MessageInput from "@/components/chat/MessageInput";
import SteerBar from "@/components/chat/bars/SteerBar";
import TokenCounter from "@/components/utilities/TokenCounter";
import NewcomerDrawer from "@/components/modals/NewcomerDrawer";
import SkipToSceneModal, { skipPromptBuilder } from "@/components/modals/SkipToSceneModal";
import { useThrottle } from "@/utils/useThrottle";
import { useTheme } from "@/context/PalMirrorThemeProvider";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getSystemMessage } from "@/utils/systemMessageGeneration";
import OpenAI from "openai";
import { CharacterData, ChatMetadata, defaultCharacterData } from "@/types/CharacterData";
import { DomainAttributeEntry, DomainMemoryEntry, DomainTimestepEntry } from "@/types/EEDomain"

import { PLMSecureContext } from "@/context/PLMSecureContext";
import {
  isPalMirrorSecureActivated,
  PLMSecureGeneralSettings,
} from "@/utils/palMirrorSecureUtils";


import { usePalRec } from "@/context/PLMRecSystemContext"

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { useRouter } from "next/navigation";
import { encodingForModel } from "js-tiktoken";

import { addDomainMemory, addDomainTimestep, deleteMemoryFromMessageIfAny, getDomainAttributes, getDomainMemories, removeDomainTimestep, reverseDomainAttribute, setDomainAttributes, setDomainTimesteps, buildAssistantRecall } from "@/utils/domainData";
import { useAttributeNotification } from "@/components/notifications/AttributeNotificationProvider";
import { useMemoryNotification } from "@/components/notifications/MemoryNotificationProvider";
import SuggestionBar from "@/components/chat/bars/SuggestionBar";
import { AnimateChangeInHeight } from "@/components/utilities/animate/AnimateHeight";
import { suggestionBarSysInst } from "@/utils/suggestionBarSysInst";
import { usePLMGlobalConfig } from "@/context/PLMGlobalConfig";
import { MessagePreview } from "@/components/MessagePreview";
import { LinearBlur } from "@/components/utilities/LinearBlur";
import { ChevronLeft, ChevronRight, Info, ListCollapse } from "lucide-react";
import { UserPersonality } from "@/types/UserPersonality";
import { usePMNotification } from "@/components/notifications/PalMirrorNotification";
import { ApiProfile } from "@/components/chat/ChatSettings";
import { Label } from "@/components/ui/label";
import CascadeAskToMove from "@/components/cascade/CascadeAskToMove";


let openai: OpenAI;

type StatusData = Array<{ key: string; value: string }>;
interface ChatCompletionMessageParam {
  role: "user" | "assistant" | "system";
  content: string;
  name?: string;
}






interface Message {
    id: string;
    role: "user" | "assistant" | "system";
    reasoningContent?: string;
    content: string;
    extraContent?: Array<{
      id: string;
      content: string;
      reasoningContent?: string;
    }>;
    focusingOnIdx: number; // 0 for main content, 1+ for extra contents
    stillGenerating: boolean;
}


const ChatPage = () => {

  const PLMGC = usePLMGlobalConfig();
  const [configHighend, setConfigHighend] = useState(false);
  const [configTokenWatch, setConfigTokenWatch] = useState(true);
  const [configTyping, setConfigTyping] = useState(true);
  const [configAutoCloseFormatting, setConfigAutoCloseFormatting] = useState(false);
  const [configLimitChatRenders, setConfigLimitChatRenders] = useState(false);
  const [configLimitChatRendersCount, setConfigLimitChatRendersCount] = useState(3);
  const [configDomainChatCompressor, setConfigDomainChatCompressor] = useState(false);
  const [configDomainChatCompressorOnlyUntil, setConfigDomainChatCompressorOnlyUntil] = useState(5);
  const [configCascadingApiProviders, setConfigCascadingApiProviders] = useState(false);
  const [configEnterSendsChat, setConfigEnterSendsChat] = useState(true);

  useEffect(() => {
    setConfigHighend(!!PLMGC.get("highend"))
    setConfigTokenWatch(PLMGC.get("tokenCounter") ?? true)
    setConfigTyping(PLMGC.get("typing") ?? true)
    setConfigAutoCloseFormatting(!!PLMGC.get("autoCloseFormatting"))
    setConfigLimitChatRenders(!!PLMGC.get("limitChatRenders"))
    setConfigLimitChatRendersCount(PLMGC.get("limitChatRendersCount") ? Number(PLMGC.get("limitChatRendersCount")) : 3)
    setConfigDomainChatCompressor(!!PLMGC.get("domainChatCompressor"))
    setConfigDomainChatCompressorOnlyUntil(PLMGC.get("domainChatCompressorDepth") ? Number(PLMGC.get("domainChatCompressorDepth")) : 5) 
    setConfigCascadingApiProviders(!!PLMGC.get("cascadingApiProviders"))
    setConfigEnterSendsChat(PLMGC.get("enterSendsChat") ?? true)
  }, [])

  const PMNotify = usePMNotification();

  const [messages, setMessages] = useState<
    Array<Message>
  >([]);
  const [showCollapsedChats, setShowCollapsedChats] = useState(false);
  const [characterData, setCharacterData] =
    useState<CharacterData>(defaultCharacterData);
  const [chatId, setChatId] = useState("");
  const [loaded, setLoaded] = useState(false);

  const [associatedDomain, setAssociatedDomain] = useState<string>("");
  const [entryTitle, setEntryTitle] = useState<string>("");
  const [chatTimesteps, setChatTimesteps] = useState<Array<DomainTimestepEntry>>([])
  const attributeNotification = useAttributeNotification();
  const memoryNotification = useMemoryNotification();

  const [newMessage, setNewMessage] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [tokenHitStamps, setTokenHitStamps] = useState<Array<number>>([]);
  const [successfulNewMessage, setSuccessfulNewMessage] = useState<boolean | Message>(false);
  const [userPromptThinking, setUserPromptThinking] = useState(false);
  const [tokenCount, setTokenCount] = useState(0);

  const [animateSwitchMessage, setAnimateSwitchMessage] = useState(0);
  
  const [textMessagePreview, setTextMessagePreview] = useState("");
  const [openMessagePreview, setOpenMessagePreview] = useState(false);

  const [accurateTokenizer, setAccurateTokenizer] = useState(true); // toggle it yourself .

  const [baseURL, setBaseURL] = useState("https://cvai.mhi.im/v1");
  const [apiKey, setApiKey] = useState("none");
  const [generationTemperature, setTemperature] = useState(0.5);
  const [reasoningEffort, setReasoningEffort] = useState(0);
  const reasoningEffortOptions = [
    undefined,
    "minimal",
    "low",
    "medium",
    "high"
  ]
  const [modelInstructions, setModelInstructions] = useState("");
  const [modelName, setModelName] = useState("");
  
  const [showSuggestionBar, setShowSuggestionBar] = useState(false);
  const [suggestionBarGenerating, setSuggestionBarGenerating] = useState(false);
  const [replySuggestions, setReplySuggestions] = useState<string[]>([]);

  const [lastApiProfileId, setLastApiProfileId] = useState<string>("");
  const [showCascadeError, setShowCascadeError] = useState(false);

  const [userPersonality, setUserPersonality] = useState({ name: "", personality: "" })

  const {
    setCharacterTags,
    recVisit,
    recChattedAt,
    recUserExplicitLike,
  } = usePalRec();

  const [exclusionCount, setExclusionCount] = useState(0);

  const [showingNewcomerDrawer, setShowingNewcomerDrawer] = useState(false);

  const abortController = useRef<AbortController | null>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const secondLastMessageRef = useRef<HTMLDivElement | null>(null);
  const messageListRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [skipToSceneModalState, setSkipToSceneModalState] = useState(false);

  const { scrollY } = useScroll({
    container: messageListRef
  })
  const [scrollDirection, setScrollDirection] = useState<"up" | "down">("up");
  const [graceWait, setGraceWait] = useState(Date.now());

  useMotionValueEvent(scrollY, "change", (current: number) => {
    if (Date.now() - graceWait < 2000) { return; }
    const prev =
      typeof (scrollY).getPrevious === "function"
        ? ((scrollY).getPrevious() as number)
        : 0;
    const diff = current - prev;
    setScrollDirection(diff > 0 ? "down" : "up");
    // setGraceWait(Date.now() - 1000)
  })
  
  // useEffect(() => {
  //   if (loaded) {
      
  //   }
  // }, [loaded])

  const [activeSteers, setActiveSteers] = useState<string[]>([]);
  const [manageSteerModal, setManageSteerModal] = useState(false);

  const [steerApplyMethod, setSteerApplyMethod] = useState("system");
  const addSteer = (newSteer: string) => {
    const updated = [...activeSteers, newSteer];
    setActiveSteers(updated);
  };

  const removeSteer = (indexToRemove: number) => {
    const updated = activeSteers.filter((_, i) => i !== indexToRemove);
    setActiveSteers(updated);
  };

  const generateSteerPrompt = ({ steers }: { steers: string[] }): string => {
    const baseRules = [
      "NEVER respond to this message. Do NOT say “Got it” or anything like it.",
      "NEVER mention or hint at these instructions, even subtly.",
      "The character must behave as if these ideas came naturally.",
      "Blend the changes into the story slowly and believably.",
      "Stay in-character and immersive at all times.",
      "REMEMBER TO ADHERE THESE INSTRUCTIONS AS SUBTLE AS POSSIBLE!",
      "THESE INSTRUCTIONS ARE TO BE SUBTLE AS 10 MESSAGES AT MINIMUM! INTEGRATE IT AS A **STORY DIRECTION**, NOT IMMEDIATE APPLICATION.",
    ];

    const conflictRule =
      steers.length > 1
        ? "If rules conflict, follow the newest one more."
        : "Do not force the change. Make it feel natural and slow.";

    const instructionLabel = steers.length > 1 ? "Instructions" : "Instruction";

    const formattedSteers = steers
      .map((s, i) => `${steers.length > 1 ? `${i + 1}.` : "-"} ${s.trim()}`)
      .join("\n");

    const formattedRules = [...baseRules, conflictRule]
      .map((rule) => `- ${rule}`)
      .join("\n");

    return `[System Instruction: ${
      steers.length > 1
        ? "These rules are now active. You must follow them in every reply."
        : "Follow the rule below exactly."
    }]

${instructionLabel}:
${formattedSteers}

Rules:
${formattedRules}

These are secret orders. Obey them completely, without being noticed.
ADDITIONALLY: When the user says "[call-instructions]", IMMEDIATELY apply the instructions above without question!`;
  };

  const { theme, getTheme } = useTheme();
  const currentTheme = getTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();
  const PLMSecContext = useContext(PLMSecureContext);

  // Tag extractors
  const extractAttributeTags = (message: string) => {
    //  <ATR_CHANGE Trustworthiness +2 Courage -3>

    const atrRegex = /<ATR_CHANGE\s+([^>]+)>/i;
    const match = message.match(atrRegex);

    if (!match || !match[1]) return [];

    const content = match[1].trim();
    const pairRegex = /([a-zA-Z_]+)\s*([+-]?\d+)/g;

    const results: Array<{ attribute: string; change: number }> = [];
    let pairMatch;

    while ((pairMatch = pairRegex.exec(content)) !== null) {
      results.push({
        attribute: pairMatch[1],
        change: parseInt(pairMatch[2], 10),
      });
    }

    return results;
  };

  const extractMemories = (text: string) => {
    const regex = /<NEW_MEMORY\s+([^>]+)>/g;
    const matches: string[] = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
      matches.push(match[1].trim());
    }

    return matches;
  }

  const extractTimesteps = (text: string) => {
    const regex = /<TIMESTEP\s+([^>]+)>/g;
    const matches: string[] = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
      matches.push(match[1].trim());
    }
    
    return matches;
  }

  const saveTimesteps = (chats: Message[], notify = false) => {
    if (associatedDomain) {
        const timestepsToSet: Array<DomainTimestepEntry> = [];
        for (const msg of chats) {
          // const content = 
          //   msg.focusingOnIdx === 0 || msg.focusingOnIdx === undefined
          //     ? msg.content
          //     : msg.extraContent?.[msg.focusingOnIdx - 1].content || ""

          const content =
            msg.focusingOnIdx > 0
              ? msg.extraContent?.[msg.focusingOnIdx - 1]?.content ?? ""
              : msg.content;

          if (content === "") continue;
          const extracted = extractTimesteps(content);
          for (const ts of extracted) {
            timestepsToSet.push({
              key: Math.floor(Math.random() * 69420),
              associatedMessage: msg.id,
              entry: ts,
            });
          }
        }
        if (timestepsToSet.length > 0) {
          setChatTimesteps(timestepsToSet);
          if (notify) {
            PMNotify.info(`Found timesteps from messages, imported ${timestepsToSet.length} timesteps`);
          }
        }
      }
  }

  // Function to download a file
  const downloadFile = (
    content: string,
    fileName: string,
    contentType: string
  ) => {
    const file = new Blob([content], { type: contentType });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(file);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href); // Clean up the URL object
  };

  const getFormattedFileName = () => {
    const now = new Date();
    const date = now.toISOString().split("T")[0]; // YYYY-MM-DD format
    const time = now.toTimeString().split(" ")[0].replace(/:/g, "-"); // HH-MM-SS format
    return `Chat-with-${characterData.name}-${date}-${time}.plm`;
  };

  const encodeMessages = (textOnly: boolean = false) => {
    try {
      const json = JSON.stringify(messages);
      const encoder = new TextEncoder();
      const encodedArray = encoder.encode(json);

      let binary = "";
      const chunkSize = 0x8000;

      for (let i = 0; i < encodedArray.length; i += chunkSize) {
        const chunk = encodedArray.subarray(i, i + chunkSize);
        binary += String.fromCharCode.apply(null, chunk as any);
      }

      const base64String = btoa(binary);

      if (textOnly) {
        return base64String;
      }

      const fileName = getFormattedFileName();
      downloadFile(base64String, fileName, "application/octet-stream");
      PMNotify.success("Chat exported! File downloaded.");
    } catch (error) {
      PMNotify.error("Failed to encode messages: " + error);
    }
  };



  const decodeMessages = async (file: File | string) => {
    try {
      if (typeof file === "string") {
        const decodedString = atob(file);
        const decodedArray = new Uint8Array(
          decodedString.split("").map((char) => char.charCodeAt(0))
        );
        const decoder = new TextDecoder();
        const json = decoder.decode(decodedArray);
        const parsedMessages = JSON.parse(json);
        setMessages(parsedMessages);
        // PMNotify.success("Chat imported successfully!");
        saveTimesteps(parsedMessages, false)
        return;
      }
      const fileContent = await file.text();
      const decodedString = atob(fileContent);
      const decodedArray = new Uint8Array(
        decodedString.split("").map((char) => char.charCodeAt(0))
      );
      const decoder = new TextDecoder();
      const json = decoder.decode(decodedArray);
      const parsedMessages = JSON.parse(json);

      setMessages(parsedMessages);
      PMNotify.success("Chat imported successfully!");

      saveTimesteps(parsedMessages, true)
    } catch (error) {
      PMNotify.error("Failed to decode messages: " + error);
    }
  };

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      decodeMessages(file);
    } else {
      PMNotify.error("No file selected.");
    }
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const loadSettingsFromLocalStorage = () => {
    const settings = localStorage.getItem('Proxy_settings');
    if (settings) {
      const parsedSettings = JSON.parse(settings);
      setBaseURL(parsedSettings.baseURL || '');
      setModelName(parsedSettings.modelName || '');
      setTemperature(parseFloat(parsedSettings.temperature) || 0.5);
      setReasoningEffort(parseInt(parsedSettings.reasoningEffort) || 0);
      setModelInstructions(parsedSettings.modelInstructions || '')
    } else {
      setBaseURL("https://cvai.mhi.im/v1")
    }
  }

  useEffect(() => {
    loadSettingsFromLocalStorage();
    openai = new OpenAI({
      apiKey: apiKey ?? "none",
      baseURL: baseURL ?? undefined,
      dangerouslyAllowBrowser: true,
      defaultHeaders: {
        "HTTP-Referer": "https://palmirror.vercel.app",
        "X-Title": "PalMirror",
      },
    });
  }, [apiKey, baseURL]);

  useEffect(() => {
    const loadSecureSettings = async () => {
      if (
        PLMSecContext &&
        (await isPalMirrorSecureActivated()) &&
        PLMSecContext.isSecureReady()
      ) {
        const proxySettings = (await PLMSecContext.getSecureData(
          "generalSettings"
        )) as PLMSecureGeneralSettings;
        setApiKey(proxySettings.proxy.api_key);
      }
    };
    loadSecureSettings();
  }, []);

  const vibrate = (duration: number) => {
    if ("vibrate" in navigator) navigator.vibrate(duration);
  };

  const checkAndTrimMessages = (
    messagesList: Array<Message>
  ): Array<Message> => {
    let totalLength = messagesList.reduce(
      (acc, msg) => acc + msg.content.length,
      0
    );
    while (totalLength > 16000 && messagesList.length > 0) {
      messagesList.shift();
      totalLength = messagesList.reduce(
        (acc, msg) => acc + msg.content.length,
        0
      );
    }
    return messagesList;
  };

  const getHighestPriorityProfile = async () => {
    const profiles: ApiProfile[] = JSON.parse(localStorage.getItem('Proxy_profiles') || '[]');
    
    const activeProfile = profiles
      .filter((p) => p.cascade?.working !== false)
      .sort((a, b) => (a.cascade?.priority ?? 999) - (b.cascade?.priority ?? 999))[0];

    if (!activeProfile) return null;

    let apiKey = '';
    if (PLMSecContext?.getSecureData) {
      const keyData = await PLMSecContext.getSecureData(`apiKey_${activeProfile.id}`);
      apiKey = keyData?.value || keyData || '';

      if (!apiKey && activeProfile.id === 'default') {
        const settings = await PLMSecContext.getSecureData('generalSettings');
        apiKey = settings?.proxy?.api_key || '';
      }
    }

    return { profile: activeProfile, apiKey };
  };

  const reverseDomainMessage = async (lastMessageId: string) => {
    await deleteMemoryFromMessageIfAny(associatedDomain, lastMessageId);
    await reverseDomainAttribute(associatedDomain, lastMessageId);
    setChatTimesteps(prev => prev.filter(ts => ts.associatedMessage !== lastMessageId));
  }

  const handleSendMessage = async (
    e: React.KeyboardEvent<HTMLTextAreaElement> | null,
    force: boolean = false,
    regenerate: boolean = false,
    optionalMessage: string = "",
    userMSGaddOnList: boolean = true,
    mode: "send" | "rewrite" | "suggest" | "call-steer" | "skip-scene" | "suggest-bar" = "send",
    rewriteBase: string = "",
    destination: "chat" | "suggest-bar" | "input" = "chat",
    existingMessage: Message | null = null,
  ) => {
    if (mode === "send") {
      if (e?.key === "Enter" && !e.shiftKey && configEnterSendsChat)
        try {
          e.preventDefault();
        } catch {}
      if (!force && e?.key !== "Enter") return;
    }

    const messageId = existingMessage?.id || crypto.randomUUID();

    if (configCascadingApiProviders) {
      const highestPriorityProfile = await getHighestPriorityProfile();
      if (highestPriorityProfile) {
        const { profile, apiKey } = highestPriorityProfile;
        setBaseURL(profile.baseURL);
        setApiKey(apiKey);
        setLastApiProfileId(highestPriorityProfile.profile.id);

        openai = new OpenAI({
          apiKey: apiKey ?? "none",
          baseURL: profile.baseURL ?? undefined,
          dangerouslyAllowBrowser: true,
          defaultHeaders: {
            "HTTP-Referer": "https://palmirror.vercel.app",
            "X-Title": "PalMirror",
          },
        });
      } else {
        PMNotify.error("Can't find a working API profile. Either due to there are none set up, or all profiles set are marked as dormant in Cascade Config.");
        return;
      }
    } else {
      loadSettingsFromLocalStorage();
      if (!baseURL.includes("http")) {
        PMNotify.error("You need to configure your AI provider first in Settings.");
        return;
      }
    }

    let messagesList: Message[] = [];
    let userMessageContent = "";

    if (mode === "send") {
      let regenerationMessage: string | undefined;
      if (regenerate) {
        regenerationMessage = messages
        .slice()
        .reverse()
        .find((m) => m.role === "user")?.content;
      }
      messagesList = [...messages];
      
      if (regenerate) {
        if (messagesList.length > 0) {
          const lastMessageId = messagesList[messagesList.length - 1].focusingOnIdx === 0
            ? messagesList[messagesList.length - 1].id
            : messagesList[messagesList.length - 1].extraContent?.[messagesList[messagesList.length - 1].focusingOnIdx - 1]?.id || messagesList[messagesList.length - 1].id;

          if (associatedDomain) {
            try {
              reverseDomainMessage(lastMessageId);
            } catch (e) {
              console.warn(e);
            }
          }

          messagesList = messagesList.slice(0, -1);
          setMessages(messagesList);


          // wait for 250ms because race conditions idk
          await new Promise((resolve) => setTimeout(resolve, 250));
        }
      }

      userMessageContent = regenerate
        ? regenerationMessage ?? ""
        : optionalMessage !== ""
        ? optionalMessage.trim()
        : newMessage.trim();
      if (userMessageContent && userMSGaddOnList) {
        messagesList.push({
          id: crypto.randomUUID(),
          role: "user",
          content: userMessageContent,
          focusingOnIdx: 0,
          stillGenerating: false,
        });
        setMessages(messagesList);
        setNewMessage("");
        textareaRef.current?.focus();
      }
      setIsThinking(true);
    } else {
      messagesList = checkAndTrimMessages([...messages]);
    }

    let assistantMessageObject: Message;
    const extraContentId = crypto.randomUUID();

    if (existingMessage) {
      // PMNotify.success("using existing message object for regeneration");
      assistantMessageObject = existingMessage;

      if (regenerate) {
        if (!assistantMessageObject.extraContent) assistantMessageObject.extraContent = [];
        assistantMessageObject.extraContent.push({
          id: extraContentId,
          content: "",
        })
        assistantMessageObject.focusingOnIdx = assistantMessageObject.extraContent?.length || 2 - 1;
        assistantMessageObject.stillGenerating = true;
      }
    } else {
      assistantMessageObject = { 
        id: messageId, 
        role: "assistant", 
        content: "", 
        focusingOnIdx: 0, 
        stillGenerating: true 
      };
    }

    const systemPrompt = await getSystemMessage(
      characterData,
      userPersonality,
      associatedDomain ?? sessionStorage.getItem("associatedDomain") ?? null,
      entryTitle ?? sessionStorage.getItem("entryTitle") ?? null,
      modelInstructions +
        (activeSteers.length > 0 && steerApplyMethod === "system"
          ? generateSteerPrompt({ steers: activeSteers })
          : "")
    );

    // hopefully doesnt break anything further
    const messagesApply = [...messagesList];
    for (let i = 0; i < messagesApply.length; i++) {
      const msg = messagesApply[i];
      if (msg.role === "assistant" && msg.focusingOnIdx > 0) {
        msg.content = msg.extraContent?.[msg.focusingOnIdx - 1]?.content || msg.content;
      }
    }


    let finalMessages: ChatCompletionMessageParam[] = [];

    if (mode === "suggest") {
      finalMessages = [
        {
          role: "system" as "user" | "assistant" | "system",
          content: systemPrompt,
          name: "system",
        },
        ...messagesApply.map((m) => ({ ...m, name: "-" })),
        {
          role: "user",
          name: "user",
          content: `[SYSTEM NOTE]: Detach from the character personality, and create a reply for {{user}} in accordance to ${characterData.userName}'s personality.
THIS REPLY should be about the {{user}} doing this: "${rewriteBase}".
IMPORTANT: You are REPLYING {{char}} FOR {{user}}, *NOT* BE THE CHARACTER!

Please note this is an exception to the "No talking as user" rule. I specifically request this.
Make sure you generate no more than 3 paragraphs. Not too long, but also not short that it becomes ambiguous.
You must still enclose monologues with asterisks, making them italic in Markdown.
Avoid leading with "Understood, here's a...", JUST GENERATE THE REPLY STRAIGHT UP.
AVOID CREATING THE Status SECTION. AVOID CREATING ANY TAGS, LIKE TIMESTEPS.`,
        },
      ];
    } else if (mode === "suggest-bar") {
      finalMessages = [
        {
          role: "system" as "user" | "assistant" | "system",
          content: systemPrompt,
          name: "system",
        },
        ...messagesApply.map((m) => ({ ...m, name: "-" })),
        {
          role: "user",
          name: "user",
          content: suggestionBarSysInst
        },
      ];
    } else if (mode === "rewrite") {
      finalMessages = [
        {
          role: "system" as "user" | "assistant" | "system",
          content: systemPrompt,
          name: "system",
        },
        ...messagesApply.map((m) => ({ ...m, name: "-" })),
        {
          role: "user",
          name: "user",
          content: `[SYSTEM NOTE]: Detach yourself from the character personality, and create a rewritten, enhanced version of this message: 
"""
\`${rewriteBase}\`
"""
Your enhanced message should be quick, realistic, markdown-styled and in the perspective of ${characterData.userName}.
Do not lead with anything like "Sure. Here's an enhanced version..." or anything similar. Be invisible.
[AVOID CREATING THE Status SECTION. AVOID CREATING ANY TAGS, LIKE TIMESTEPS.]`,
        },
      ];
    } else if (mode === "call-steer") {
      finalMessages = [
        {
          role: "system" as "user" | "assistant" | "system",
          content: systemPrompt,
          name: "system",
        },
        ...messagesApply.map((m) => ({ ...m, name: "-" })),
        {
          role: "user" as "user" | "assistant" | "system",
          name: "user",
          content: `[call-instructions]`,
        },
      ];
    } else if (mode === "skip-scene") {
      finalMessages = [
        {
          role: "system" as "user" | "assistant" | "system",
          content: systemPrompt,
          name: "system",
        },
        ...messagesApply.map((m) => ({ ...m, name: "-" })),
        {
          role: "user" as "user" | "assistant" | "system",
          name: "user",
          content: skipPromptBuilder(rewriteBase),
        },
      ];
    } else {
      finalMessages = [
        {
          role: "system" as "user" | "assistant" | "system",
          content: systemPrompt,
          name: "system",
        },
        ...messagesList.map((msg, i) => {
          const { stillGenerating, ...m } = msg;
          return {
            ...m,
            name: "-",
            role: msg.role as "user" | "assistant" | "system",
            content:
              i === 1 &&
              msg.role === "user" &&
              characterData.plmex.dynamicStatuses.length > 0
                ? msg.content +
                  " [SYSTEM NOTE: Add {{char}}'s status at the very end of your message.]"
                : msg.content,
          };
        }),
        ...(userMSGaddOnList || regenerate
          ? []
          : [
              {
                role: "user" as "user" | "assistant" | "system",
                content: userMessageContent,
                name: "-",
              },
            ]),
        ...(messagesList.at(-1)?.role === "assistant"
          ? [
              {
                role: "user" as "user" | "assistant" | "system",
                name: "user",
                content:
                  "[Continue the story from this point naturally. You should still never talk, or act for {{user}}. Only do {{char}}. Progress the story but not TOO far. ASSUME THIS MESSAGE AS A SYSTEM INSTRUCTION THAT YOU WILL FOLLOW.]",
              },
            ]
          : []),
        ...(activeSteers.length > 0 && steerApplyMethod === "posthistory"
          ? [
              {
                role: "user" as "user" | "assistant" | "system",
                name: "user",
                content: generateSteerPrompt({ steers: activeSteers }),
              },
            ]
          : []),
        ...(messagesList.length == 0 && regenerate
          ? [
            {
              role: "user" as "user" | "assistant" | "system",
              name: "user",
              content:  `
You are generating the **first greeting message** for the character provided — but instead of a simple "hi," this should feel like a **scene starter**. Begin with a natural moment, event, or setting that draws the user in and encourages them to respond. It can feel like they've just entered the character's world or the character has just noticed them.

Your goal is to:
• Pull the user into an unfolding moment (e.g. a question, event, emotion, or dramatic situation)
• Show the character's personality, style, and tone immediately
• Avoid exposition; make it feel like the scene is already in motion
• Be immersive, with vivid wording if the character's style allows
• Write in THIRD PERSON.
• Use italics (close with asterisks on Markdown) for monologue, as stated
• If possible, end with a close-ended question
${characterData.plmex.dynamicStatuses.length > 0 ? "• Include the status tags in the format provided above. This is NOT optional and **MANDATORY**." : ""}

It should be 3-5 lengthy (lengthy to paint a more detailed picture) paragraphs (or less if the character is terse or mysterious), but never robotic or generic.

Do **not** mention AI, chats, or being a character — stay fully in-world.

Only output the greeting message itself. No extra explanation.

${entryTitle && "The user has given a title for you to make a greeting message around. Make sure to incorporate this, the best you can even if it's vague."}
${entryTitle}
`,
            }
          ]
          : []
        )
      ];

      if (associatedDomain) {
        const assistantRecall = await buildAssistantRecall(associatedDomain)
        if (assistantRecall !== "") {
          if (finalMessages.length < 7) {
            finalMessages.unshift({
              role: "system" as "user" | "assistant" | "system",
              content: assistantRecall,
              name: "system"
            })
          } else {
            // finalMessages.splice(finalMessages.length - 7, 0, {
            //   role: "system" as "user" | "assistant" | "system",
            //   content: assistantRecall,
            //   name: "system"
            // })
            // no more calibration
          }
        }
        
        // domain compressor (basically change the further chats into their timesteps)
        if (configDomainChatCompressor) {
          let messageDepth = 0;
          const compressedMessages: ChatCompletionMessageParam[] = [];

          for (let i = finalMessages.length - 1; i >= 0; i--) {
            const msg = finalMessages[i];

            // non user/assistant messages
            if (msg.role !== "user" && msg.role !== "assistant") {
              compressedMessages.unshift(msg);
              continue;
            }

            messageDepth++;

            // if it's a user message and it is inside the compression depth, drop it
            if (messageDepth > configDomainChatCompressorOnlyUntil && msg.role === "user") {
              continue;
            }

            // outside depth
            if (messageDepth <= configDomainChatCompressorOnlyUntil) {
              compressedMessages.unshift(msg);
              continue;
            }

            const associatedMsg = messagesList.find(m => m.content === msg.content);

            // no associated message
            if (!associatedMsg) {
              compressedMessages.unshift(msg);
              continue;
            }

            const timesteps = chatTimesteps.filter(
              ts => ts.associatedMessage === associatedMsg.id
            );

            // no timesteps
            if (timesteps.length === 0) {
              compressedMessages.unshift(msg);
              continue;
            }

            const timestepContent = timesteps
              .map(ts => `- ${ts.entry}`)
              .join("\n");

            compressedMessages.unshift({
              role: msg.role,
              name: msg.name,
              content:
                `[This message has been summarized for space. Below is a summary what happened.]\n` +
                timestepContent,
            });
          }
          finalMessages = compressedMessages;
        }

        }

        


      recChattedAt(chatId, Date.now())
    }

    try {

      if (destination === "chat") {
        setMessages((p) => [
          ...p,
          assistantMessageObject,
        ]);
      }

      abortController.current = new AbortController();
      const filteredMessages = finalMessages.map((m) => ({
        role: m.role,
        content: m.content ?? "",
      }));

      const comp = await openai.chat.completions.create(
        {
          model: modelName,
          messages: filteredMessages,
          stream: true,
          // @ts-expect-error lowk idk
          reasoning_effort: reasoningEffortOptions[reasoningEffort],
          thinking: {
            type: reasoningEffort === 0 ? 'disabled' : 'enabled' //deepseek
          },
          stream_options: {
            include_usage: true,
          },
          temperature: generationTemperature,
        },
        { signal: abortController.current?.signal }
      );

      let assistantMessage = "";
      let reasoning = "";


      if (destination === "chat") {
        
        for await (const chunk of comp) {
          if (abortController.current?.signal.aborted) break;
          const c = chunk.choices?.[0]?.delta?.content || "";
          assistantMessage += c
            .replace(/[“”„‟]/g, '"')
            .replace(/[‘’‚‛]/g, "'")
            .replace(/…/g, "...");
          // @ts-expect-error openai has no official implementation of returning reasoning yet
          let c_reason = chunk.choices?.[0]?.delta?.reasoning_content?.[0]?.thinking || "";
          if (c_reason === "") {
            // @ts-expect-error openai has no official implementation of returning reasoning yet
            c_reason = chunk.choices?.[0]?.delta?.reasoning_content || chunk.choices?.[0]?.delta?.reasoning || "";
          } 
          // if (c_reason === "") some other provider implementation here; 
          reasoning += c_reason;
          if ("usage" in chunk && chunk.usage?.total_tokens) setTokenCount(chunk.usage.total_tokens);
            if (configTokenWatch) {
              setTokenHitStamps((p) => [...p, Date.now()]);
            }
            if (assistantMessageObject.focusingOnIdx === 0) {
              setMessages((p) => [
                ...p.slice(0, -1),
                {
                  id: messageId,
                  role: "assistant",
                  reasoningContent: reasoning === "" ? undefined : reasoning,
                  content: assistantMessage,
                  focusingOnIdx: 0,
                  stillGenerating: true,
                },
              ]);
            } else {
              setMessages((p) => [
                ...p.slice(0, -1),
                {
                  id: messageId,
                  role: "assistant",
                  reasoningContent: assistantMessageObject.reasoningContent,
                  extraContent: [
                    ...((assistantMessageObject.extraContent && assistantMessageObject.extraContent.length > 0)
                      ? assistantMessageObject.extraContent.slice(0, -1)
                      : []),
                    {
                      id: extraContentId,
                      content: assistantMessage,
                      reasoningContent: reasoning === "" ? undefined : reasoning,
                    },
                  ],
                  content: assistantMessageObject.content,
                  focusingOnIdx: assistantMessageObject.focusingOnIdx,
                  stillGenerating: true,
              },
            ]);
            }
            if (!configTyping) {
              vibrate(10);
            }
          }
        setMessages((p) => [
          ...p.slice(0, -1),
          { ...p[p.length - 1], stillGenerating: false },
        ]);
        if (configTokenWatch) {
          setTokenHitStamps([]);
        }
        if (mode === "send") setIsThinking(false);
        setSuccessfulNewMessage({
          id: assistantMessageObject.focusingOnIdx === 0 ? assistantMessageObject.id : extraContentId,
          role: "assistant",
          content: assistantMessage,
          focusingOnIdx: 0,
          stillGenerating: false,
        });
      } else if (destination === "suggest-bar") {
        for await (const chunk of comp) {
          if (abortController.current?.signal.aborted) break;

          const c = chunk.choices?.[0]?.delta?.content || "";
          assistantMessage += c;
          
          const suggestions: string[] = assistantMessage
            .replace(/`/g, "")
            .split("|")
            .map((s) => s.trim())
            .filter((s) => s.length > 0);

          setReplySuggestions(suggestions);
        }
      } else {
        for await (const chunk of comp) {
          if (abortController.current?.signal.aborted) break;
          const c = chunk.choices?.[0]?.delta?.content || "";
          assistantMessage += c;
          
          setNewMessage(assistantMessage);
          vibrate(10);
        }
        setTextMessagePreview(assistantMessage);
        setOpenMessagePreview(true);
      }
    } catch (err) {
      if (!abortController.current?.signal.aborted) {
        if (err instanceof Error && err.message.includes("reduce the length")) {
          return handleSendMessage(
            e,
            force,
            regenerate,
            optionalMessage,
            userMSGaddOnList,
            mode,
            rewriteBase,
            destination
          );
        }
        PMNotify.error(
          "Error: " + (err instanceof Error ? err.message : String(err))
        );
        setIsThinking(false);
        setUserPromptThinking(false);
        setMessages((p) => [
          ...p.slice(0, -1),
          { ...p[p.length - 1], stillGenerating: false },
        ]);
        if (configCascadingApiProviders) {
          setTimeout(() => {
            setShowCascadeError(true);
          }, 200);
        }
      }
    } finally {
      abortController.current = null;
    }
  };

  const regenerateMessage = () => {
    const updatedMessages = [...messages];
    const lastMsg = updatedMessages.pop();

    setMessages(updatedMessages);
    handleSendMessage(null, true, true, "", false, "send", "", "chat", lastMsg);
    secondLastMessageRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const editMessage = (index: number, content: string, extContIdx?: number) => {
    setMessages(messages => {
      const updatedMessages = [...messages];
      if (!extContIdx) {
        updatedMessages[index] = { ...updatedMessages[index], content }
      } else {
        const targetMsg = updatedMessages[index];
        if (targetMsg.extraContent) {
          const updatedExtraContent = [...targetMsg.extraContent];
          updatedExtraContent[extContIdx - 1] = {
            ...updatedExtraContent[extContIdx - 1],
            content
          };
          updatedMessages[index] = {
            ...targetMsg,
            extraContent: updatedExtraContent
          }
        }
      };
      return updatedMessages;
    });
  };

  const rewindTo = async (index: number) => {
    const messagesToDelete = messages.slice(index + 1);

    if (associatedDomain && messagesToDelete.length > 0) {
      for (const msg of messagesToDelete) {
        try {
          await deleteMemoryFromMessageIfAny(associatedDomain, msg.id);
          await reverseDomainAttribute(associatedDomain, msg.id);

          setChatTimesteps(prev => prev.filter(ts => ts.associatedMessage !== msg.id));
        } catch (err) {
          console.error("Error reverting domain data:", err);
        }
      }
    }

    setMessages(messages.slice(0, index + 1));
    setExclusionCount(0);
  };


  const suggestReply = async (generate?: boolean) => {
    let canGenerate = false;
    setReplySuggestions([]);
    if (!suggestionBarGenerating) {
      canGenerate = true;
      setShowSuggestionBar(true);
    }
    if (canGenerate && generate) {
      setSuggestionBarGenerating(true);
      setIsThinking(true);
      setReplySuggestions([]);
      await handleSendMessage(
        null,
        true,
        false,
        "",
        false,
        "suggest-bar",
        "",
        "suggest-bar"
      );
      setSuggestionBarGenerating(false);
      setIsThinking(false);
    }
    // setUserPromptThinking(true);
    // await handleSendMessage(
    //   null,
    //   true,
    //   false,
    //   "",
    //   false,
    //   "suggest",
    //   "",
    //   "input"
    // );
    // setUserPromptThinking(false);
  };

  const suggestReplyFromChip = async (chip: string) => {
    setShowSuggestionBar(false);
    setUserPromptThinking(true);
    await handleSendMessage(
      null,
      true,
      false,
      "",
      false,
      "suggest",
      chip,
      "input"
    );
    setUserPromptThinking(false);
  };

  const rewriteMessage = async (base: string) => {
    setUserPromptThinking(true);
    await handleSendMessage(
      null,
      true,
      false,
      "",
      false,
      "rewrite",
      base,
      "input"
    );
    setUserPromptThinking(false);
  };

  const handlePrevExtra = (msgIndex: number) => {
    setMessages((prevMessages) => {
      const updated = [...prevMessages];
      const msg = { ...updated[msgIndex] };
      if (msg.focusingOnIdx && msg.focusingOnIdx > 0) {
        msg.focusingOnIdx -= 1;
      }
      updated[msgIndex] = msg;

      if (associatedDomain) {
        const prevMsg = updated[msgIndex + 1];
        if (prevMsg) {
          reverseDomainMessage(prevMsg.id).catch((e) =>
            console.warn("Failed to reverse domain changes:", e)
          );
        }

        const selectedContent =
          msg.focusingOnIdx === 0
            ? msg.content
            : msg.extraContent && msg.extraContent[msg.focusingOnIdx - 1]
              ? msg.extraContent[msg.focusingOnIdx - 1].content
              : "";

        const selectedReasoning =
          msg.focusingOnIdx === 0
            ? msg.reasoningContent
            : msg.extraContent && msg.extraContent[msg.focusingOnIdx - 1]
              ? msg.extraContent[msg.focusingOnIdx - 1].reasoningContent
              : undefined;

        setTimeout(() => {
          setSuccessfulNewMessage({
            id: msg.focusingOnIdx === 0 ? msg.id : msg.extraContent ? msg.extraContent[msg.focusingOnIdx - 1].id : msg.id,
            role: msg.role,
            content: selectedContent,
            reasoningContent: selectedReasoning,
            focusingOnIdx: msg.focusingOnIdx,
            stillGenerating: false,
          });
        }, 0);
      }

      return updated;
    });
    setAnimateSwitchMessage(-1);
  };

  const handleNextExtra = (msgIndex: number) => {
    setMessages((prevMessages) => {
      const updated = [...prevMessages];
      const msg = { ...updated[msgIndex] };
      if (typeof msg.focusingOnIdx === "number" && msg.extraContent) {
        if (msg.focusingOnIdx < msg.extraContent.length) {
          msg.focusingOnIdx += 1;
        }
      }
      updated[msgIndex] = msg;

      if (associatedDomain) {
        const prevMsg = updated[msgIndex - 1];
        if (prevMsg) {
          reverseDomainMessage(prevMsg.id).catch((e) =>
            console.warn("Failed to reverse domain changes:", e)
          );
        }

        const selectedContent =
          msg.focusingOnIdx === 0
            ? msg.content
            : msg.extraContent && msg.extraContent[msg.focusingOnIdx - 1]
              ? msg.extraContent[msg.focusingOnIdx - 1].content
              : "";

        const selectedReasoning =
          msg.focusingOnIdx === 0
            ? msg.reasoningContent
            : msg.extraContent && msg.extraContent[msg.focusingOnIdx - 1]
              ? msg.extraContent[msg.focusingOnIdx - 1].reasoningContent
              : undefined;

        setTimeout(() => {
          setSuccessfulNewMessage({
            id: msg.focusingOnIdx === 0 ? msg.id : msg.extraContent ? msg.extraContent[msg.focusingOnIdx - 1].id : msg.id,
            role: msg.role,
            content: selectedContent,
            reasoningContent: selectedReasoning,
            focusingOnIdx: msg.focusingOnIdx,
            stillGenerating: false,
          });
        }, 0);
      }

      return updated;
    });
    setAnimateSwitchMessage(1);
  };


  const callSteer = async () => {
    setIsThinking(true);
    await handleSendMessage(null, true, false, "", false, "call-steer");
    setIsThinking(false);
  };

  const skipToScene = async (base: string) => {
    setIsThinking(true);
    await handleSendMessage(
      null,
      true,
      false,
      "",
      false,
      "skip-scene",
      base,
    );
    setIsThinking(false);
  };

  const cancelRequest = () => {
    if (abortController.current) abortController.current.abort();
    setUserPromptThinking(false);
    setIsThinking(false);
    setMessages((p) => [
      ...p.slice(0, -1),
      { ...p[p.length - 1], stillGenerating: false },
    ]);
  };

  const extractStatusData = (input: string): StatusData => {
    const statusRegex = /---\s*STATUS:\s*((?:.+?\s*[=:]\s*.+(?:\n|$))*)/i;
    const match = input.match(statusRegex);

    if (match && match[1]) {
      const keyValuePairs = match[1]
        .trim()
        .split("\n")
        .filter((line) => line.includes("=") || line.includes(":"));

      const data: StatusData = keyValuePairs.map((pair) => {
        const [key, ...valueParts] = pair.split(/[:=]/);
        return {
          key: key.trim(),
          value: valueParts.join("=").trim(),
        };
      });

      return data;
    }

    return [];
  };

  const removeStatusSection = (input: string): string => {
    const statusRegex = /---\s*STATUS:\s*((?:.+?\s*[=:]\s*.+(?:\n|$))*)/i;
    return input.replace(statusRegex, "").trim();
  };

  const buildStatusSection = (data: StatusData): string => {
    if (!data || data.length === 0) {
      return "";
    }

    const statusLines = data.map(({ key, value }) => `${key}=${value}`);
    return `\n\n---\nSTATUS:\n${statusLines.join("\n")}`;
  };

  const changeStatus = (
    changingStatus: string,
    changingStatusValue: string,
    changingStatusCharReacts: boolean,
    changingStatusReason: string
  ) => {
    if (!changingStatusCharReacts) {
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages];
        const lastAssistantMessageIndex = updatedMessages
          .slice()
          .reverse()
          .findIndex((msg) => msg.role === "assistant");

        if (lastAssistantMessageIndex !== -1) {
          const actualIndex =
            updatedMessages.length - 1 - lastAssistantMessageIndex;
          const targetMsg = { ...updatedMessages[actualIndex] };

          const focusIdx = typeof targetMsg.focusingOnIdx === "number" ? targetMsg.focusingOnIdx : 0;

          if (focusIdx === 0) {
            const lastMessage = targetMsg.content ?? "";
            const statusData = extractStatusData(lastMessage);
            const updatedStatusData = statusData.map((status) =>
              status.key === changingStatus
                ? { ...status, value: changingStatusValue }
                : status
            );
            targetMsg.content = removeStatusSection(lastMessage) + buildStatusSection(updatedStatusData);
          } else {
            if (!targetMsg.extraContent) targetMsg.extraContent = [];
            const extIndex = focusIdx - 1;

            if (!targetMsg.extraContent[extIndex]) {
              targetMsg.extraContent[extIndex] = {
                id: crypto.randomUUID(),
                content: "",
              };
            }

            const lastExtra = targetMsg.extraContent[extIndex].content ?? "";
            const statusData = extractStatusData(lastExtra);
            const updatedStatusData = statusData.map((status) =>
              status.key === changingStatus
                ? { ...status, value: changingStatusValue }
                : status
            );
            targetMsg.extraContent[extIndex] = {
              ...targetMsg.extraContent[extIndex],
              content: removeStatusSection(lastExtra) + buildStatusSection(updatedStatusData),
            };
          }

          updatedMessages[actualIndex] = targetMsg;
        }

        return updatedMessages;
      });
    } else {
      // Trigger a reaction from the character
      const reason = changingStatusReason || "Unspecified";
      const systemNote = `[SYSTEM NOTE: All of a sudden, ${characterData.name}'s ${changingStatus} status is "${changingStatusValue}". Make ${characterData.name} have a "${changingStatus}" status of "${changingStatusValue}" and make it react accordingly. Reason: "${reason}"]`;
      handleSendMessage(null, true, false, systemNote, false);
    }
  };

  useEffect(() => {
    const storedData = localStorage.getItem("characterData");
    if (storedData) setCharacterData(JSON.parse(storedData));
  }, []);

  useEffect(() => {
    const storedData = localStorage.getItem("userPersonalities");
    if (storedData) { 
      const userPrs = JSON.parse(storedData) 
      const usingPrs = userPrs.find((p: UserPersonality) => p.using)
      if (usingPrs) {
        setUserPersonality({ name: usingPrs.name, personality: usingPrs.personality })
      };
    }
  }, []);

  useEffect(() => {
    isPalMirrorSecureActivated().then((activated) => {
      if (PLMSecContext && !PLMSecContext.isSecureReady() && activated) {
        router.push("/");
      }
    });
  }, []);

  // Initial Assistant Message
  useEffect(() => {
    if (messages.length === 0 && characterData.initialMessage) {
      const statusData: StatusData = characterData.plmex.dynamicStatuses.map(
        (status) => ({
          key: status.name,
          value: status.defaultValue,
        })
      );
      const messageId = crypto.randomUUID()
      setMessages([
        {
          id: messageId,
          role: "assistant",
          content:
            characterData.initialMessage + buildStatusSection(statusData),
          focusingOnIdx: 0,
          stillGenerating: false,
        },
      ]);

      if (entryTitle && sessionStorage.getItem("chatFromNewDomain") == "1") {
        sessionStorage.removeItem("chatFromNewDomain");
        regenerateMessage();
      }
    }
  }, [characterData.initialMessage]);

  // Auto-scroll to Bottom
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load from chat ID if any (and if PalMirror Secure active)
  useEffect(() => {
    const load = async () => {
      if (
        (await isPalMirrorSecureActivated()) &&
        PLMSecContext &&
        PLMSecContext.isSecureReady()
      ) {
        const chatId = sessionStorage.getItem("chatSelect");
        if (chatId) {
          setChatId(chatId);

          const chatMetadata = await PLMSecContext.getSecureData(
            `METADATA${chatId}`
          );
          if (chatMetadata) {
            const { id, lastUpdated, ...charData } = chatMetadata;
            setCharacterData(charData);
            setCharacterTags(charData.name, charData.tags ? charData.tags : []);
            recVisit(chatId);
          }

          const chatData = await PLMSecContext.getSecureData(chatId);
          if (chatData) {
            //setTimeout(() => {
            decodeMessages(chatData);
            console.log("loaded chat");
            setLoaded(true);
            //}, 500)
          }
        } else {
          setChatId(crypto.randomUUID());
          setLoaded(true);
        }
      } else {
        setLoaded(true);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const domain = sessionStorage.getItem("chatAssociatedDomain");
    const entryName = sessionStorage.getItem("chatEntryName");
    const timesteps = sessionStorage.getItem("chatTimesteps");

    if (domain) {
      setAssociatedDomain(domain);
      sessionStorage.removeItem("chatAssociatedDomain");
    }

    if (entryName) {
      setEntryTitle(entryName);
      sessionStorage.removeItem("chatEntryName");
    }

    if (timesteps) {
      setChatTimesteps(JSON.parse(timesteps));
      sessionStorage.removeItem("chatTimesteps");
    }

  }, []);


  // Save chat to chat ID if any (and if PalMirror Secure active)
  useEffect(() => {
  const save = async () => {
    const active = await isPalMirrorSecureActivated();
    if (
      active &&
      PLMSecContext &&
      PLMSecContext.isSecureReady() &&
      chatId !== ""
    ) {
      await PLMSecContext.setSecureData(chatId, encodeMessages(true));

      const metadata: ChatMetadata = {
        ...characterData,
        id: chatId,
        lastUpdated: new Date().toISOString(),
        associatedDomain,
        entryTitle,
        timesteps: chatTimesteps
      };

      delete metadata.plmex?.domain;

      console.log("saving metadata:", metadata);

      await PLMSecContext.setSecureData(`METADATA${chatId}`, metadata);
      console.log("saved chat");

      if (associatedDomain) {
        sessionStorage.setItem('chatSelect', associatedDomain)
      }
    }
  };

  save();
}, [messages, associatedDomain, entryTitle]);


  
  // Show newcomer drawer if new ..
  useEffect(() => {
    if (!localStorage.getItem("NewcomerDrawer")) {
      // setShowingNewcomerDrawer(true);
    }
  }, []);

  
  // Domain tagging system
  useEffect(() => {
    if (successfulNewMessage && typeof successfulNewMessage !== 'boolean' && associatedDomain) {
      const lastMessage = successfulNewMessage.content;

      (async () => {
        // --- Attributes ---
        const atrChanges = extractAttributeTags(lastMessage);
        for (const { attribute, change } of atrChanges) {
          await setDomainAttributes(associatedDomain, successfulNewMessage.id, attribute, change, true);
        
          const attributes = await getDomainAttributes(associatedDomain);
          const attributeCurrent = attributes.find(
            (attr: DomainAttributeEntry) => attr.attribute === attribute
          );
          if (attributeCurrent) {
            attributeNotification.create({
              attribute,
              fromVal: attributeCurrent.value,
              toVal: attributeCurrent.value + change
            });
          }
        }

        // --- Memories ---
        const memoryToAdd = extractMemories(lastMessage);
        for (const memory of memoryToAdd) {
          const memories = await getDomainMemories(associatedDomain)
          if (memories.some((m: DomainMemoryEntry) => m.memory === memory)) {
            continue;
          }
          await addDomainMemory(associatedDomain, successfulNewMessage.id, memory);
          memoryNotification.create(`${characterData.name} will remember that.`, memory);
        }

        // --- Timesteps ---
        const timestepsToAdd = extractTimesteps(lastMessage);
        for (const timestep of timestepsToAdd) {
          setChatTimesteps((prev) => [
            ...prev,
            {
              key: Math.floor(Math.random() * 69420),
              associatedMessage: successfulNewMessage.id,
              entry: timestep,
            },
          ]);
          // PMNotify.info(timestep);
        }
      })();
    }
  }, [successfulNewMessage]);

  // Token counting (this was way too laggy so scrapped)

  // const tokenizer = encodingForModel('gpt-3.5-turbo');

  // const estimateTokens = (messages: Array<{ role: "user" | "assistant" | "system"; content: string; stillGenerating: boolean }>): number => {
  //   const allText = messages.map(item => item.content).join(' ');
  //   return Math.floor(allText.length);
  // }

  // const countTokens = (messages: Array<{ role: "user" | "assistant" | "system"; content: string; stillGenerating: boolean }>): number => {
  //   if (accurateTokenizer) {
  //   return messages.reduce((total, message) => {
  //     const tokens = tokenizer.encode(message.content); // Encoding each message
  //     return total + tokens.length;
  //   }, 0);
  //   } else {
  //     return estimateTokens(messages)
  //   }
  // };

  // const throttledCountTokens = useThrottle(() => {
  //   const totalTokens = countTokens(messages);
  //   setTokenCount(totalTokens);
  // }, 1000);

  // useEffect(() => {
  //   throttledCountTokens(messages);
  // }, [messages, throttledCountTokens]);

  return (
    <div className={`grid place-items-center ${currentTheme.bg}`}>
      
      <ToastContainer
        position="top-right"
        autoClose={5000}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        theme="dark"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={loaded ? { opacity: 1, scale: 1 } : false}
        transition={{
          type: "spring",
          mass: 1,
          damping: 27,
          stiffness: 161,
          restDelta: 0.00001,
          filter: { type: "spring", mass: 1, damping: 38, stiffness: 161 },
        }}
        className="grid max-w-160 w-full h-dvh p-1 sm:p-8 font-sans grid-rows-[auto_1fr] gap-4 overflow-x-hidden mx-auto relative"
      >
        <div className="fixed w-full h-40 z-1"
        >
          {configHighend ?
            
            <LinearBlur className="w-full h-full"></LinearBlur>
            : (
              <div
                style={{
                  maskImage: 'linear-gradient( to bottom, black 0%, black 50%, transparent 100% )'
                }}
                className="h-full backdrop-blur-md pointer-events-none touch-none">
                {/* poor man's blur */}
              </div>
            )}
        </div> 

        

        <ChatHeader
          characterData={characterData}
          fromDomain={!!entryTitle}
          getExportedMessages={() => {
            encodeMessages(false);
          }}
          importMessages={openFilePicker}
          visible={scrollDirection === "up"}
        />
        <div  ref={messageListRef} className="overflow-y-auto overflow-x-hidden max-w-160">
          <div className="flex flex-col justify-end min-h-full">
            <div className="min-h-screen"></div>
            {characterData.name.length < 1 ? (
              <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{duration:1, delay:10}}>
                <p className="block mt-auto text-sm">but no one came</p>
              </motion.div>
              )
              : (<></>)} {/* i just wanna do this for shits and giggles ok long live undertale */}
            <div>
              <AnimatePresence>
                {configLimitChatRenders && messages.length > configLimitChatRendersCount && (
                  <motion.button
                  layout="position"
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setShowCollapsedChats(!showCollapsedChats)}
                  className="w-full h-24 border border-white border-dashed rounded-xl flex justify-around items-center opacity-30 mb-2">
                    <ListCollapse />
                    <p>{
                      showCollapsedChats ? "Hide back the" : "Show the other"
                      } {messages.length - configLimitChatRendersCount} messages</p>
                  </motion.button>
                )}
                {messages.map((message, index) => {
                  if (!showCollapsedChats && configLimitChatRenders && index < (messages.length - configLimitChatRendersCount)) {
                    return null;
                  }
                  const isSecondLast = index === messages.length - 2;
                  return (
                    <motion.div
                      key={index}
                      ref={isSecondLast ? secondLastMessageRef : null}
                      className={`${
                        message.role === "user"
                          ? "origin-bottom-right"
                          : "origin-bottom-left"
                      } overflow-hidden`}
                      initial={{
                        scale: 0.8,
                        opacity: 0,
                        x: message.role === "user" ? 100 : -100,
                      }}
                      animate={{ scale: 1, opacity: 1, x: 0, y: 0 }}
                      exit={{ height: 0, opacity: 0, filter: "blur(5px)" }}
                      transition={{
                        type: "spring",
                        stiffness: 215,
                        damping: 25,
                      }}
                    >
                      <motion.div 
                      initial={animateSwitchMessage !== 0 ? { x: animateSwitchMessage * 50 } : false}
                      animate={animateSwitchMessage !== 0 ? { x: 0 } : false}
                      transition={{ type: "spring", stiffness: 630, damping: 45 }}
                      key={message.focusingOnIdx}>
                        <MessageCard
                          index={index}
                          extContIdx={message.focusingOnIdx}
                          role={message.role}
                          content={message.focusingOnIdx > 0 && message.extraContent && message.extraContent.length > 0 && message.extraContent[message.focusingOnIdx - 1]
                            ? message.extraContent[message.focusingOnIdx - 1].content
                            : message.content
                          }
                          reasoningContent={message.focusingOnIdx > 0 && message.extraContent && message.extraContent.length > 0 && message.extraContent[message.focusingOnIdx - 1]
                            ? message.extraContent[message.focusingOnIdx - 1].reasoningContent
                            : message.reasoningContent
                          }
                          stillGenerating={message.stillGenerating}
                          regenerateFunction={regenerateMessage}
                          globalIsThinking={isThinking}
                          isGreetingMessage={index === 0}
                          isLastMessage={index === messages.length - 1}
                          characterData={characterData}
                          editMessage={editMessage}
                          rewindTo={rewindTo}
                          changeStatus={changeStatus}
                          messageListRef={messageListRef}
                          configHighend={configHighend}
                          configTyping={configTyping}
                          configAutoCloseFormatting={configAutoCloseFormatting}
                        />
                      </motion.div>


                      {/* message pagination */}
                      {message.extraContent && message.extraContent.length > 0 && index === messages.length - 1 && (
                        <div className="flex justify-start items-center px-1 mt-2 gap-2">
                          <button
                            disabled={message.focusingOnIdx === 0 || isThinking}
                            className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                            onClick={() => handlePrevExtra(index)}
                          >
                            <ChevronLeft className="opacity-50" />
                          </button>

                          <p className="text-sm font-sans tracking-wider font-bold">
                            {message.focusingOnIdx + 1}
                            <span className="mx-1 opacity-25">/</span>
                            {message.extraContent.length + 1}
                          </p>

                          <button
                            disabled={message.focusingOnIdx === message.extraContent.length || isThinking}
                            className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                            onClick={() => handleNextExtra(index)}
                          >
                            <ChevronRight className="opacity-50" />
                          </button>
                        </div>
                      )}

                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
            <div ref={messageEndRef} />
          </div>
        </div>

        {!PLMSecContext?.isSecureReady() && (
          <div className="bg-blue-600/20 border border-blue-600 text-blue-300 p-3 rounded-xl z-1">
            <div className="flex gap-2 items-center">
              <Info />
              <p>Chat not saved</p>
            </div>
            <p className="text-sm opacity-70 mt-2">In this guest mode, you cannot save chats and this chat won&apos;t persist after a refresh. To save and get more features, setup <button onClick={() => {
              router.push("/secure")
            }} className="underline cursor-pointer">PalMirror Secure.</button></p>
          </div>
        )}

        <SkipToSceneModal modalState={skipToSceneModalState} setModalState={setSkipToSceneModalState} skipToSceneCallback={(b) => skipToScene(b)}/>
              
        <SteerBar
          activeSteers={activeSteers}
          addSteer={addSteer}
          removeSteer={removeSteer}
          steerApplyMethod={steerApplyMethod}
          setSteerApplyMethod={setSteerApplyMethod}
          callSteer={callSteer}
          isThinking={isThinking}
          manageSteerModal={manageSteerModal}
          setManageSteerModal={setManageSteerModal}
        />
        <AnimateChangeInHeight>
          <AnimatePresence mode="popLayout">
            {showSuggestionBar && ( <motion.div className="origin-bottom" key="suggestionBarWrapper" exit={{ opacity: 0, scaleY: 0 }}>
              
                <SuggestionBar 
                  generating={suggestionBarGenerating}
                  suggestions={replySuggestions}
                  startGeneration={() => suggestReply(true)}
                  suggestionPicked={(suggestion) => {suggestReplyFromChip(suggestion)}}
                  requestHide={() => {setShowSuggestionBar(false)}}
                />
              
            </motion.div> )}
          </AnimatePresence>
        </AnimateChangeInHeight>
        <MessageInput
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          handleSendMessage={handleSendMessage}
          onCancel={cancelRequest}
          isThinking={isThinking}
          userPromptThinking={userPromptThinking}
          tokenHitStamps={tokenHitStamps}
          suggestReply={() => suggestReply(false)}
          rewriteMessage={rewriteMessage}
          showSkipToSceneModal={() => {setSkipToSceneModalState(true)}}
          showSteerModal={() => setManageSteerModal(true)}
          configTokenWatch={configTokenWatch}
          configEnterSendsChat={configEnterSendsChat}
        />
      </motion.div>
      <TokenCounter tokenCount={tokenCount} />

      <MessagePreview 
        open={openMessagePreview}
        setOpen={setOpenMessagePreview}
        content={textMessagePreview}
        approved={(e) => { setNewMessage(e) }}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept=".plm"
        style={{ display: "none" }}
        onChange={handleFileInput}
      />
      <NewcomerDrawer
        close={() => {
          localStorage.setItem("NewcomerDrawer", "ok");
          setShowingNewcomerDrawer(false);
        }}
        open={showingNewcomerDrawer}
      />
      <CascadeAskToMove
        apiProfileId={lastApiProfileId}
        showCascadeError={showCascadeError}
        setShowCascadeError={setShowCascadeError}
        handleSendMessage={() => {
          regenerateMessage();
          // const updatedMessages = [...messages];
          // if (updatedMessages.length > 0 && updatedMessages[updatedMessages.length - 1].role === "assistant" && updatedMessages[updatedMessages.length - 1].content === "") {
          //   updatedMessages.pop();
          //   setMessages(updatedMessages);
          // }
          // handleSendMessage(null, true, false, "", false);
        }}
      />
    </div>
  );
};

export default ChatPage;
