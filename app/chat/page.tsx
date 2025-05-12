"use client";

import { useState, useEffect, useRef, useContext } from "react";
import React from "react";
import MessageCard from "@/components/MessageCard";
import ChatHeader from "@/components/ChatHeader";
import MessageInput from "@/components/MessageInput";
import TokenCounter from "@/components/TokenCounter";
import NewcomerDrawer from "@/components/NewcomerDrawer";
import { useThrottle } from "@/utils/useThrottle";
import { useTheme } from "@/components/PalMirrorThemeProvider";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getSystemMessage } from "@/components/systemMessageGeneration";
import OpenAI from "openai";
import { CharacterData, defaultCharacterData } from "@/types/CharacterData";

import { PLMSecureContext } from "@/context/PLMSecureContext";
import {
  isPalMirrorSecureActivated,
  PLMSecureGeneralSettings,
} from "@/utils/palMirrorSecureUtils";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { encodingForModel } from "js-tiktoken";

let openai: OpenAI;

type StatusData = Array<{ key: string; value: string }>;
interface ChatCompletionMessageParam {
  role: "user" | "assistant" | "system";
  content: string;
  name?: string;
}

const ChatPage = () => {
  const [messages, setMessages] = useState<
    Array<{
      role: "user" | "assistant" | "system";
      content: string;
      stillGenerating: boolean;
    }>
  >([]);
  const [characterData, setCharacterData] =
    useState<CharacterData>(defaultCharacterData);
  const [chatId, setChatId] = useState("");
  const [loaded, setLoaded] = useState(false);

  const [newMessage, setNewMessage] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [userPromptThinking, setUserPromptThinking] = useState(false);
  const [tokenCount, setTokenCount] = useState(0);
  const [accurateTokenizer, setAccurateTokenizer] = useState(true); // toggle it yourself .

  const [baseURL, setBaseURL] = useState("https://cvai.mhi.im/v1");
  const [apiKey, setApiKey] = useState("none");
  const [generationTemperature, setTemperature] = useState(0.5);
  const [modelInstructions, setModelInstructions] = useState("");
  const [modelName, setModelName] = useState("");

  const [exclusionCount, setExclusionCount] = useState(0);

  const [showingNewcomerDrawer, setShowingNewcomerDrawer] = useState(false);

  const abortController = useRef<AbortController | null>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const secondLastMessageRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [activeSteers, setActiveSteers] = useState<string[]>([]);
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

    return `[System Instruction: ${steers.length > 1 ? "These rules are now active. You must follow them in every reply." : "Follow the rule below exactly."}]

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

  // Function to download a file
  const downloadFile = (
    content: string,
    fileName: string,
    contentType: string,
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
      const base64String = btoa(String.fromCharCode(...encodedArray));
      if (textOnly) {
        return base64String;
      }
      // Use the formatted file name
      const fileName = getFormattedFileName();
      downloadFile(base64String, fileName, "application/octet-stream");
      toast.success("Chat exported! File downloaded.");
    } catch (error) {
      toast.error("Failed to encode messages: " + error);
    }
  };

  const decodeMessages = async (file: File | string) => {
    try {
      if (typeof file === "string") {
        const decodedString = atob(file);
        const decodedArray = new Uint8Array(
          decodedString.split("").map((char) => char.charCodeAt(0)),
        );
        const decoder = new TextDecoder();
        const json = decoder.decode(decodedArray);
        const parsedMessages = JSON.parse(json);
        setMessages(parsedMessages);
        // toast.success("Chat imported successfully!");
        return;
      }
      const fileContent = await file.text(); // Read the file content
      const decodedString = atob(fileContent);
      const decodedArray = new Uint8Array(
        decodedString.split("").map((char) => char.charCodeAt(0)),
      );
      const decoder = new TextDecoder();
      const json = decoder.decode(decodedArray);
      const parsedMessages = JSON.parse(json);

      setMessages(parsedMessages);
      toast.success("Chat imported successfully!");
    } catch (error) {
      toast.error("Failed to decode messages: " + error);
    }
  };

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      decodeMessages(file);
    } else {
      toast.error("No file selected.");
    }
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const loadSettingsFromLocalStorage = () => {
    const settings = localStorage.getItem("Proxy_settings");
    if (settings) {
      const parsedSettings = JSON.parse(settings);
      setBaseURL(parsedSettings.baseURL || "");
      setModelName(parsedSettings.modelName || "");
      setTemperature(parseFloat(parsedSettings.temperature) || 0.5);
      setModelInstructions(parsedSettings.modelInstructions || "");
    } else {
      setBaseURL("https://cvai.mhi.im/v1");
    }
  };

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
          "generalSettings",
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
    messagesList: Array<{
      role: "user" | "assistant" | "system";
      content: string;
      stillGenerating: boolean;
    }>,
  ) => {
    let totalLength = messagesList.reduce(
      (acc, msg) => acc + msg.content.length,
      0,
    );
    while (totalLength > 16000 && messagesList.length > 0) {
      messagesList.shift();
      totalLength = messagesList.reduce(
        (acc, msg) => acc + msg.content.length,
        0,
      );
    }
    return messagesList;
  };

  const handleSendMessage = async (
  e: React.KeyboardEvent<HTMLTextAreaElement> | null,
  force = false,
  regenerate = false,
  optionalMessage = "",
  userMSGaddOnList = true,
  mode = 'send',
  rewriteBase: string = "",
  destination = 'chat'
) => {
  if (mode === 'send') {
    if (e?.key === "Enter") try { e.preventDefault(); } catch {}
    if (!force && e?.key !== "Enter") return;
  }

  loadSettingsFromLocalStorage();
  if (!baseURL.includes("http")) {
    toast.error("You need to configure your AI provider first in Settings.");
    return;
  }

  let messagesList: Array<{ role: string; content: string; stillGenerating?: boolean }> = [];
  let userMessageContent = "";

  if (mode === 'send') {
    let regenerationMessage: string | undefined;
    if (regenerate) {
      regenerationMessage = messages
        .slice()
        .reverse()
        .find((m) => m.role === "user")
        ?.content;
    }
    messagesList = [...messages];
    if (regenerate) {
      messagesList = messagesList.slice(0, -1);
      setMessages(messagesList);
    }
    userMessageContent = regenerate
      ? regenerationMessage ?? ''
      : optionalMessage !== ''
        ? optionalMessage.trim()
        : newMessage.trim();
    if (userMessageContent && userMSGaddOnList) {
      messagesList.push({ role: 'user', content: userMessageContent, stillGenerating: false });
      setMessages(messagesList);
      setNewMessage('');
      textareaRef.current?.focus();
    }
    setIsThinking(true);
  } else {
    messagesList = checkAndTrimMessages([...messages]);
  }

  const systemPrompt = getSystemMessage(
    characterData,
    modelInstructions +
      (activeSteers.length > 0 && steerApplyMethod === "system"
        ? generateSteerPrompt({ steers: activeSteers })
        : "")
  );

  let finalMessages: ChatCompletionMessageParam[] = [];

  if (mode === 'suggest') {
    finalMessages = [
      { role: 'system', content: systemPrompt, name: 'system' },
      ...messagesList.map((m) => ({ ...m, name: '-' })),
      { role: 'user', name: 'user', content:
        `[SYSTEM NOTE]: Detach from the character personality, and create a quick answer for {{user}} in accordance to ${characterData.userName}'s personality. Answer must be thoughtful and quick.`
      }
    ];
  } else if (mode === 'rewrite') {
    finalMessages = [
      { role: 'system', content: systemPrompt, name: 'system' },
      ...messagesList.map((m) => ({ ...m, name: '-' })),
      { role: 'user', name: 'user', content:
        `[SYSTEM NOTE]: Detach yourself from the character personality, and create a rewritten, enhanced version of this message: \`${rewriteBase}\`
Your enhanced message should be quick, realistic, markdown-styled and in the perspective of ${characterData.userName}.` }
    ];
  } else if (mode === 'call-steer') {
    finalMessages = [
      { role: 'system', content: systemPrompt, name: 'system' },
      ...messagesList.map((m) => ({ ...m, name: '-' })),
      { role: 'user', name: 'user', content:
        `[call-instructions].`
      }
    ];
  } else {
    finalMessages = [
      { role: 'system', content: systemPrompt, name: 'system' },
      ...messagesList.map((msg, i) => {
        const { stillGenerating, ...m } = msg;
        return {
          ...m,
          name: '-',
          role: msg.role as 'user' | 'assistant' | 'system',
          content: i === 1 && msg.role === 'user' && characterData.plmex.dynamicStatuses.length > 0
            ? msg.content +
              ' [SYSTEM NOTE: Add {{char}}\'s status at the very end of your message.]'
            : msg.content
        };
      }),
      ...(userMSGaddOnList || regenerate ? [] : [{ role: 'user', content: userMessageContent, name: '-' }]),
      ...(messagesList.at(-1)?.role === 'assistant'
        ? [{ role: 'user', name: 'user', content:
            '[Continue the story naturally. You should still never talk, or act for {{user}}. Only do {{char}}. Progress the story but not TOO far. Use 3 minutes as reference (or shorter). ASSUME THIS MESSAGE AS A SYSTEM INSTRUCTION THAT YOU WILL FOLLOW.]'
          }]
        : []),
      ...(activeSteers.length > 0 && steerApplyMethod === 'posthistory'
        ? [{ role: 'user', name: 'user', content: generateSteerPrompt({ steers: activeSteers }) }]
        : [])
    ];
  }

  try {
    abortController.current = new AbortController();
    const comp = await openai.chat.completions.create({
      model: modelName,
      messages: finalMessages,
      stream: true,
      temperature: generationTemperature
    });

    let assistantMessage = '';

    if (destination === 'chat') {
      setMessages((p) => [...p, { role: 'assistant', content: '', stillGenerating: true }]);
      for await (const chunk of comp) {
        if (abortController.current?.signal.aborted) break;
        const c = chunk.choices[0].delta.content || '';
        assistantMessage += c;
        if ('usage' in chunk && chunk.usage?.total_tokens) setTokenCount(chunk.usage.total_tokens);
        setMessages((p) => [...p.slice(0, -1), { role: 'assistant', content: assistantMessage, stillGenerating: true }]);
        vibrate(10);
      }
      setMessages((p) => [...p.slice(0, -1), { ...p[p.length - 1], stillGenerating: false }]);
      if (mode === 'send') setIsThinking(false);
    } else {
      for await (const chunk of comp) {
        if (abortController.current?.signal.aborted) break;
        const c = chunk.choices[0].delta.content || '';
        assistantMessage += c;
        setNewMessage(assistantMessage);
        vibrate(10);
      }
    }
  } catch (err) {
    if (!abortController.current?.signal.aborted) {
      if (err instanceof Error && err.message.includes('reduce the length')) {
        return handleSendMessage(e, force, regenerate, optionalMessage, userMSGaddOnList, mode, rewriteBase, destination);
      }
      toast.error('Error: ' + (err instanceof Error ? err.message : String(err)));
    }
  } finally {
    abortController.current = null;
  }
};


  const regenerateMessage = () => {
    const updatedMessages = [...messages];

    updatedMessages.pop();

    setMessages(updatedMessages);
    handleSendMessage(null, true, true, "", false);
    secondLastMessageRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const editMessage = (index: number, content: string) => {
    const updatedMessages = [...messages];
    updatedMessages[index] = { ...updatedMessages[index], content };
    setMessages(updatedMessages);
  };

  const rewindTo = (index: number) => {
    setMessages(messages.slice(0, index + 1));
    setExclusionCount(0);
  };

  const suggestReply = async () => {
    setUserPromptThinking(true);
    await handleSendMessage(null, true, false, "", false, "suggest", 'input');
    setUserPromptThinking(false);
  };

  const rewriteMessage = async (base: string) => {
    setUserPromptThinking(true);
    await handleSendMessage(null, true, false, "", false, "rewrite", base, 'input');
    setUserPromptThinking(false);
  };

  const callSteer = async () => {
    setIsThinking(true);
    await handleSendMessage(null, true, false, "", false, "call-steer");
    setIsThinking(false);
  };

  const cancelRequest = () => {
    if (abortController.current) abortController.current.abort();
    setUserPromptThinking(false);
    setIsThinking(false);
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
    changingStatusReason: string,
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
          const lastMessage = updatedMessages[actualIndex].content;
          const statusData = extractStatusData(lastMessage);
          const updatedStatusData = statusData.map((status) =>
            status.key === changingStatus
              ? { ...status, value: changingStatusValue }
              : status,
          );
          updatedMessages[actualIndex].content =
            removeStatusSection(lastMessage) +
            buildStatusSection(updatedStatusData);
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
        }),
      );
      setMessages([
        {
          role: "assistant",
          content:
            characterData.initialMessage + buildStatusSection(statusData),
          stillGenerating: false,
        },
      ]);
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
            `METADATA${chatId}`,
          );
          if (chatMetadata) {
            const { id, lastUpdated, ...charData } = chatMetadata;
            setCharacterData(charData);
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

  // Save chat to chat ID if any (and if PalMirror Secure active)
  useEffect(() => {
    const save = async () => {
      if (
        (await isPalMirrorSecureActivated()) &&
        PLMSecContext &&
        PLMSecContext.isSecureReady() &&
        chatId !== ""
      ) {
        await PLMSecContext.setSecureData(chatId, encodeMessages(true));
        await PLMSecContext.setSecureData(`METADATA${chatId}`, {
          ...characterData,
          id: chatId,
          lastUpdated: new Date().toISOString(),
        });
        console.log("saved chat");
      }
    };
    save();
  }, [messages]);

  // Show newcomer drawer if new ..
  useEffect(() => {
    if (!localStorage.getItem("NewcomerDrawer")) {
      // setShowingNewcomerDrawer(true);
    }
  }, []);

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
        initial={{ opacity: 0, scale: 0.8, filter: "blur(10px)" }}
        animate={loaded ? { opacity: 1, scale: 1, filter: "blur(0px)" } : false}
        transition={{
          type: "spring",
          mass: 1,
          damping: 25,
          stiffness: 161,
          filter: { type: "spring", mass: 1, damping: 38, stiffness: 161 },
        }}
        className="grid max-w-[40rem] w-full h-dvh p-1 sm:p-8 font-sans grid-rows-[auto_1fr] gap-4 overflow-x-hidden mx-auto"
      >
        <ChatHeader
          characterData={characterData}
          getExportedMessages={() => {
            encodeMessages(false);
          }}
          importMessages={openFilePicker}
        />
        <div className="overflow-y-auto overflow-x-hidden max-w-[40rem]">
          <div className="flex flex-col justify-end min-h-full">
            <div style={{ height: "60vh" }}></div>
            <div>
              <AnimatePresence>
                {messages.map((message, index) => {
                  const isSecondLast = index === messages.length - 2;
                  return (
                    <motion.div
                      key={index}
                      ref={isSecondLast ? secondLastMessageRef : null}
                      className={`${message.role === "user" ? "origin-bottom-right" : "origin-bottom-left"} overflow-hidden`}
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
                      <MessageCard
                        index={index}
                        role={message.role}
                        content={message.content}
                        stillGenerating={message.stillGenerating}
                        regenerateFunction={regenerateMessage}
                        globalIsThinking={isThinking}
                        isGreetingMessage={index === 0}
                        isLastMessage={index === messages.length - 1}
                        characterData={characterData}
                        editMessage={editMessage}
                        rewindTo={rewindTo}
                        changeStatus={changeStatus}
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
            <div ref={messageEndRef} />
          </div>
        </div>

        <MessageInput
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          handleSendMessage={handleSendMessage}
          onCancel={cancelRequest}
          isThinking={isThinking}
          userPromptThinking={userPromptThinking}
          suggestReply={suggestReply}
          rewriteMessage={rewriteMessage}
          activeSteers={activeSteers}
          addSteer={addSteer}
          removeSteer={removeSteer}
          steerApplyMethod={steerApplyMethod}
          setSteerApplyMethod={setSteerApplyMethod}
          callSteer={callSteer}
        />
      </motion.div>
      <TokenCounter tokenCount={tokenCount} />
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
    </div>
  );
};

export default ChatPage;
