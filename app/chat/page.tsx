"use client";

import { useState, useEffect, useRef } from "react";
import MessageCard from "@/components/MessageCard";
import ChatHeader from "@/components/ChatHeader";
import MessageInput from "@/components/MessageInput";
import { useTheme } from '@/components/PalMirrorThemeProvider';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getSystemMessage } from "@/components/systemMessageGeneration";
import OpenAI from "openai";

let openai: OpenAI;

const ChatPage = () => {
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant" | "system"; content: string; stillGenerating: boolean }>>([]);
  const [characterData, setCharacterData] = useState({
    name: "",
    personality: "",
    initialMessage: "",
    scenario: "",
    userName: "",
    userPersonality: ""
  });
  const [newMessage, setNewMessage] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [userPromptThinking, setUserPromptThinking] = useState(false);
  const [baseURL, setBaseURL] = useState("");
  const [apiKey, setApiKey] = useState("none");
  const [generationTemperature, setTemperature] = useState(0.5);
  const [modelInstructions, setModelInstructions] = useState("");
  const [modelName, setModelName] = useState('gpt-3.5-turbo');

  const abortController = useRef<AbortController | null>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const secondLastMessageRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { theme, setTheme } = useTheme();
  const encodeMessages = () => {
    try {
      const json = JSON.stringify(messages);
      const encoder = new TextEncoder();
      const encodedArray = encoder.encode(json);
      const base64String = btoa(String.fromCharCode(...encodedArray));
      toast.success("Chat exported! Your chat is copied to clipboard.");
      return base64String;
    } catch (error) {
      toast.error("Failed to encode messages: " + error);
      return "";
    }
  };
  
  const decodeMessages = (encoded: string) => {
    try {
      const decodedString = atob(encoded);
      const decodedArray = new Uint8Array(decodedString.split("").map(char => char.charCodeAt(0)));
      const decoder = new TextDecoder();
      const json = decoder.decode(decodedArray);
      const parsedMessages = JSON.parse(json);
      setMessages(parsedMessages);
      toast.success("Chat imported!");
      return parsedMessages;
    } catch (error) {
      toast.error("Failed to decode messages: " + error);
      return [];
    }
  };
  
  const loadSettingsFromLocalStorage = () => {
    const settings = localStorage.getItem('Proxy_settings');
    if (settings) {
      const parsedSettings = JSON.parse(settings);
      setBaseURL(parsedSettings.baseURL || '');
      setApiKey(parsedSettings.apiKey || '');
      setModelName(parsedSettings.modelName || '');
      setTemperature(parseFloat(parsedSettings.temperature) || 0.5);
      setModelInstructions(parsedSettings.modelInstructions || '')
    }
  }

  useEffect(() => {
    loadSettingsFromLocalStorage();
    openai = new OpenAI({
      apiKey: apiKey ?? "none",
      baseURL: baseURL ?? undefined,
      dangerouslyAllowBrowser: true,
    });
  }, [apiKey, baseURL]);

  const vibrate = (duration: number) => {
    if ("vibrate" in navigator) navigator.vibrate(duration);
  };

  const handleSendMessage = async (
    e: React.KeyboardEvent<HTMLTextAreaElement> | null,
    force = false,
    regenerate = false,
    optionalMessage = ""
  ) => {
    // Prevent default behavior if Enter key is pressed
    if (e && e.key === "Enter") {
      try {
        e.preventDefault();
      } catch {}
    }
    // Return early if not forced, and Enter key not pressed
    if (!force && ((e && e.key !== "Enter"))) return; 

    loadSettingsFromLocalStorage();
    if (!baseURL.includes("https://")) {
      toast.error("You need to configure your AI provider first in Settings.");
      return;
    }

    let regenerationMessage: string | undefined;
    if (regenerate) {
      const userMessage = messages.slice().reverse().find(message => message.role === 'user');
      regenerationMessage = userMessage?.content;
    }

    let messagesList = [...messages]; // Create a copy to avoid direct mutation, and because how React states work
    if (regenerate) {
      messagesList = [
        ...messagesList.slice(0, -2),
      ]
      setMessages(messagesList);
    };

    const userMessageContent = regenerate ? (regenerationMessage ? regenerationMessage : "") : (optionalMessage !== "" ? optionalMessage.trim() : newMessage.trim());

    if (userMessageContent) {
      // Add user message to the message list
      messagesList = [
        ...messagesList, 
        { role: "user", content: userMessageContent, stillGenerating: false }
      ]
      // Update the messages state
      setMessages(messagesList);
      // Clear the input field
      setNewMessage("");
      // Refocus the textarea
      textareaRef.current?.focus();
    }
    setIsThinking(true);
    const systemMessageContent = getSystemMessage(characterData, modelInstructions);

    try {
      abortController.current = new AbortController();
      const comp = await openai.chat.completions.create({
        model: modelName,
        messages: [
          { role: "system", content: systemMessageContent, name: "system" },
          ...messagesList.map((msg) => ({ ...msg, name: "-" })),
        ],
        stream: true,
        temperature: generationTemperature,
      });

      let assistantMessage = "";
      // Add a placeholder message while waiting for the response
      setMessages(prevMessages => [
        ...prevMessages, 
        { role: "assistant", content: "...", stillGenerating: true }
      ]);

      for await (const chunk of comp) {
        if (abortController.current?.signal.aborted) break;

        const chunkContent = chunk.choices[0].delta.content || "";
        assistantMessage += chunkContent;

        // Update the message with the latest chunk
        setMessages((prevMessages) => [
          ...prevMessages.slice(0, -1),
          { role: "assistant", content: assistantMessage, stillGenerating: true },
        ]);
        vibrate(10);
      }
    } catch (error) {
      if (!abortController.current?.signal.aborted) toast.error("Error: " + error);
      //Remove the placeholder message if there is an error
    } finally {
      setMessages((prevMessages) => [
        ...prevMessages.slice(0, -1),
        { ...prevMessages[prevMessages.length - 1], stillGenerating: false },
      ]);
      setIsThinking(false);
      abortController.current = null;
    }
  };

  const regenerateMessage = () => {    
    const updatedMessages = [...messages];

    updatedMessages.pop();

    setMessages(updatedMessages);
    handleSendMessage(null, true, true);
    secondLastMessageRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const editMessage = (index: number, content: string) => {
    const updatedMessages = [...messages];
    updatedMessages[index] = { ...updatedMessages[index], content };
    setMessages(updatedMessages);
  };

  const rewindTo = (index: number) => {
    setMessages(messages.slice(0, index + 1));
  };

  const suggestReply = async () => {
    setUserPromptThinking(true);
    const systemMessageContent = getSystemMessage(characterData, modelInstructions);

    try {
      abortController.current = new AbortController();
      const comp = await openai.chat.completions.create({
        model: modelName,
        messages: [
          { role: "system", content: systemMessageContent, name: "system" },
          ...messages.map((msg) => ({ ...msg, name: "-" })),
          { role: "user", content: `[SYSTEM NOTE]: Detach yourself from the character personality, and create a quick reply for ${characterData.userName} in accordance to ${characterData.userName}'s personality. Reply must be thoughtful and quick.`, name: "user" },
        ],
        stream: true,
        temperature: generationTemperature,
      });

      let assistantMessage = "";

      for await (const chunk of comp) {
        if (abortController.current?.signal.aborted) break;

        const chunkContent = chunk.choices[0].delta.content || "";
        assistantMessage += chunkContent;

        // Update the message input box
        setNewMessage(assistantMessage)
        vibrate(10);
      }
    } catch (error) {
      if (!abortController.current?.signal.aborted) toast.error("Error: " + error);
      setUserPromptThinking(false);
      abortController.current = null;
    } finally {
      setUserPromptThinking(false);
      abortController.current = null;
    }
  };

  const rewriteMessage = async (base: string) => {
    setUserPromptThinking(true);
    const systemMessageContent = getSystemMessage(characterData, modelInstructions);

    try {
      abortController.current = new AbortController();
      const comp = await openai.chat.completions.create({
        model: modelName,
        messages: [
          { role: "system", content: systemMessageContent, name: "system" },
          ...messages.map((msg) => ({ ...msg, name: "-" })),
          { role: "user", content: `[SYSTEM NOTE]: Detach yourself from the character personality, and create a rewritten, enhanced version of this message: \`${base}\`\nYour enhanced message should be quick, realistic, markdown-styled and in the perspective of ${characterData.userName}.`, name: "user" },
        ],
        stream: true,
        temperature: generationTemperature,
      });

      let assistantMessage = "";

      for await (const chunk of comp) {
        if (abortController.current?.signal.aborted) break;

        const chunkContent = chunk.choices[0].delta.content || "";
        assistantMessage += chunkContent;

        // Update the message input box
        setNewMessage(assistantMessage)
        vibrate(10);
      }
    } catch (error) {
      if (!abortController.current?.signal.aborted) toast.error("Error: " + error);
      setUserPromptThinking(false);
      abortController.current = null;
    } finally {
      setUserPromptThinking(false);
      abortController.current = null;
    }
  };


  const cancelRequest = () => {
    if (abortController.current) abortController.current.abort();
    setUserPromptThinking(false);
    setIsThinking(false);
  };

  useEffect(() => {    
    const storedData = localStorage.getItem("characterData");
    if (storedData) setCharacterData(JSON.parse(storedData));
  }, []);

  // Initial Assistant Message
  useEffect(() => {
    if (messages.length === 0 && characterData.initialMessage) {
      setMessages([{ role: "assistant", content: characterData.initialMessage, stillGenerating: false }]);
    }
  }, [characterData.initialMessage]);

  // Auto-scroll to Bottom
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className={`grid place-items-center ${theme == "cai" ? "bg-[#18181b]" : ""}`}>
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
      <div className="grid max-w-[40rem] w-full h-dvh p-2 sm:p-8 font-sans grid-rows-[auto_1fr] gap-4">
        <ChatHeader characterName={characterData.name} getExportedMessages={encodeMessages} importMessages={decodeMessages} />
        <div className="overflow-y-auto overflow-x-hidden">
          <div className="flex flex-col justify-end min-h-full">
            <div style={{ height: "60vh" }}></div>
            {messages.map((message, index) => {
              const isSecondLast = index === messages.length - 2;
              return (
                <div key={index} ref={isSecondLast ? secondLastMessageRef : null}>
                  <MessageCard
                    index={index}
                    role={message.role}
                    content={message.content}
                    stillGenerating={message.stillGenerating}
                    regenerateFunction={regenerateMessage}
                    globalIsThinking={isThinking}
                    isLastMessage={index === messages.length - 1}
                    characterData={characterData}
                    editMessage={editMessage}
                    rewindTo={rewindTo}
                  />
                </div>
              );
            })}
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
        />
      </div>
    </div>
  );
};

export default ChatPage;
