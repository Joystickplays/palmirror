"use client";

import { useState, useEffect, useRef } from "react";
import MessageCard from "@/components/MessageCard";
import ChatHeader from "@/components/ChatHeader";
import MessageInput from "@/components/MessageInput";
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
  });
  const [newMessage, setNewMessage] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [baseURL, setBaseURL] = useState("");
  const [apiKey, setApiKey] = useState("none");
  const [generationTemperature, setGenerationTemperature] = useState(0.5);

  const abortController = useRef<AbortController | null>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const secondLastMessageRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load Proxy Configuration
  const loadProxyConfig = () => {
    const savedBaseURL = localStorage.getItem("Proxy_baseURL");
    const savedApiKey = localStorage.getItem("Proxy_apiKey");
    const savedTemperature = localStorage.getItem("Proxy_Temperature");
    if (savedBaseURL) setBaseURL(savedBaseURL);
    if (savedApiKey) setApiKey(savedApiKey);
    if (savedTemperature) setGenerationTemperature(parseFloat(savedTemperature));
  };

  useEffect(() => {
    loadProxyConfig();
    openai = new OpenAI({
      apiKey: apiKey ?? "none",
      baseURL: baseURL ?? undefined,
      dangerouslyAllowBrowser: true,
    });
  }, [apiKey, baseURL]);

  // Vibrate Device
  const vibrate = (duration: number) => {
    if ("vibrate" in navigator) navigator.vibrate(duration);
  };

  // Send Message Function
  const handleSendMessage = async (
    e: React.KeyboardEvent<HTMLTextAreaElement> | null,
    force = false,
    regenerate = false
  ) => {
    if (e && e.key == "Enter") try { e.preventDefault() } catch {};
    if (!force && (!newMessage.trim() || (e && e.key !== "Enter"))) return;
    
    // debugger;
    // Ensure Proxy Configuration
    loadProxyConfig();
    if (!baseURL.includes("https://")) {
      toast.error("You need to configure your AI provider first in Settings.");
      return;
    }

    let regenerationMessage: string | undefined;
    if (regenerate) {
      // set regenerationMessage to latest message with user role content
      const userMessage = messages.slice().reverse().find(message => message.role === 'user');
      regenerationMessage = userMessage?.content;
    }

    let messagesList = messages
    if (regenerate) {
      messagesList = [
        ...messagesList.slice(0, -2),
      ]
      setMessages(messagesList);
      console.log(messages)
    };

    const userMessageContent = regenerate ? (regenerationMessage ? regenerationMessage : "") : newMessage.trim();
    
    // Add User Message
    if (userMessageContent) {
      messagesList =  [
        ...messagesList, 
        { role: "user", content: userMessageContent, stillGenerating: false }
      ]
      setMessages(messagesList);
      setNewMessage("");
      textareaRef.current?.focus();
    }
    console.log(messagesList)
    setIsThinking(true);
    const systemMessageContent = getSystemMessage(characterData);

    try {
      abortController.current = new AbortController();
      const comp = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemMessageContent, name: "system" },
          ...messagesList.map((msg) => ({ ...msg, name: "-" })),
        ],
        stream: true,
        temperature: generationTemperature,
      });

      let assistantMessage = "";
      setMessages(prevMessages => [
        ...prevMessages, 
        { role: "assistant", content: "...", stillGenerating: true }
      ]);

      for await (const chunk of comp) {
        if (abortController.current?.signal.aborted) break;

        const chunkContent = chunk.choices[0].delta.content || "";
        assistantMessage += chunkContent;

        setMessages((prevMessages) => [
          ...prevMessages.slice(0, -1),
          { role: "assistant", content: assistantMessage, stillGenerating: true },
        ]);
        vibrate(10);
      }
    } catch (error) {
      if (!abortController.current?.signal.aborted) console.error("Error:", error);
    } finally {
      setMessages((prevMessages) => [
        ...prevMessages.slice(0, -1),
        { ...prevMessages[prevMessages.length - 1], stillGenerating: false },
      ]);
      setIsThinking(false);
      abortController.current = null;
    }
  };

  // Regenerate Last Message
  const regenerateMessage = () => {
    // Temporarily save the current state of the messages
    const updatedMessages = [...messages];
  
    // Remove the last message (which is presumably the one in progress)
    updatedMessages.pop();
  
    // Regenerate the message by calling `handleSendMessage` only after the state update
    setMessages(updatedMessages);
    handleSendMessage(null, true, true);
    secondLastMessageRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  

  // Cancel Ongoing Request
  const cancelRequest = () => {
    if (abortController.current) abortController.current.abort();
    setIsThinking(false);
  };

  // Load Character Data
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
    <div className="grid place-items-center">
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
        <ChatHeader characterName={characterData.name} />
        <div className="overflow-y-auto overflow-x-hidden">
          <div className="flex flex-col justify-end gap-2 min-h-full">
            <div style={{ height: "60vh" }}></div>
            {messages.map((message, index) => {
              const isSecondLast = index === messages.length - 2;
              return (
                <div key={index} ref={isSecondLast ? secondLastMessageRef : null}>
                  <MessageCard
                    role={message.role}
                    content={message.content}
                    stillGenerating={message.stillGenerating}
                    regenerateFunction={regenerateMessage}
                    globalIsThinking={isThinking}
                    isLastMessage={index === messages.length - 1}
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
          handleSendMessage={(e) => handleSendMessage(e, false)}
          onCancel={cancelRequest}
          isThinking={isThinking}
        />
      </div>
    </div>
  );
};

export default ChatPage;
