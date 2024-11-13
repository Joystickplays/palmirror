"use client";
import { useState, useEffect, useRef } from 'react';
import MessageCard from "@/components/MessageCard";
import ChatHeader from "@/components/ChatHeader";
import MessageInput from "@/components/MessageInput";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { getSystemMessage } from "@/components/systemMessageGeneration";

import OpenAI from "openai";

let openai: OpenAI;

const ChatPage = () => {
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant" | "system"; content: string, stillGenerating: boolean }>>([]);
  const [characterData, setCharacterData] = useState({
    name: '',
    personality: '',
    initialMessage: '',
    scenario: '',
  });
  const [newMessage, setNewMessage] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [baseURL, setBaseURL] = useState('');
  const [apiKey, setApiKey] = useState('none');
  const [generationTemperature, setGenerationTemperature] = useState(0.5);

  const abortController = useRef<AbortController | null>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const secondLastMessageRef = useRef<HTMLDivElement | null>(null);

  const getProxyConf = () => {
    const savedBaseURL = localStorage.getItem('Proxy_baseURL');
    const savedApiKey = localStorage.getItem('Proxy_apiKey');
    const savedTemperature = localStorage.getItem('Proxy_Temperature')
    if (savedBaseURL) { setBaseURL(savedBaseURL) };
    if (savedApiKey) { setApiKey(savedApiKey) };
    if (savedTemperature) { setGenerationTemperature(parseFloat(savedTemperature)) };
  };

  
  useEffect(() => {
    getProxyConf()
    console.log(baseURL)
    openai = new OpenAI({
      apiKey: apiKey ?? 'none',
      baseURL: baseURL ?? undefined,
      dangerouslyAllowBrowser: true // nothing could possibly go wrong, right
    });
  }, [apiKey, baseURL]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const vibrate = (dur: number) => {
    if ("vibrate" in navigator) {
      navigator.vibrate(dur)
    }
  }

  const handleSendMessage = (e: React.KeyboardEvent<HTMLTextAreaElement>, force: boolean) => {
    if (e.key === 'Enter' && !e.ctrlKey && newMessage.trim() !== "" || force) {
      try { e.preventDefault(); } catch {}

      // Check if a proxy URL is provided (contains https://)
      getProxyConf()

      if (!baseURL.includes('https://')) {
        toast.error("You need to configure your AI provider first in Settings.");
        return;
      }

      setIsThinking(true);

      // Add user message
      if (newMessage.trim() !== "") {
        setMessages(prevMessages => [
          ...prevMessages,
          { role: "user", content: newMessage, stillGenerating: false }
        ]);
      }
      setNewMessage('');
      textareaRef.current?.focus();

      const sendMessage = async () => {
        const systemMessageContent = getSystemMessage(characterData);
        const userMessageContent = newMessage ?? "Hello";

        // Create a new AbortController instance for each request
        abortController.current = new AbortController();

        try {
          console.log(messages)
          const comp = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
              { role: "system", content: systemMessageContent, name: "system" },
              ...messages.map(msg => ({ ...msg, name: "-" })),
              { role: "user", content: userMessageContent, name: "user" }
            ],
            stream: true,
            temperature: generationTemperature
          });

          let assistantMessage = ""; // To accumulate the streamed content
          
          setMessages(prevMessages => [
            ...prevMessages,
            { role: "assistant", content: "...", stillGenerating: true }
          ]);
          for await (const chunk of comp) {
            // Check if the request has been aborted
            if (abortController.current?.signal.aborted) {
              console.log("Request was cancelled");
              break;
            }

            const chunkContent = chunk.choices[0].delta.content || "";
            assistantMessage += chunkContent;

            // Update the chat messages in real-time
            setMessages(prevMessages => [
              ...prevMessages.slice(0, -1),
              { role: "assistant", content: assistantMessage, stillGenerating: true }
            ]);
            vibrate(10)
          }
        } catch (error) {
          if (abortController.current?.signal.aborted) {
            console.log('Request was canceled');
          } else {
            console.error('Error occurred:', error);
          }
        } finally {
          setMessages(prevMessages => [
            ...prevMessages.slice(0, -1),
            { 
              role: "assistant", 
              content: prevMessages[prevMessages.length - 1]?.content || "", 
              stillGenerating: false 
            }
          ]);          
          abortController.current = null;
          setIsThinking(false);
        }
      };

      sendMessage();
    }
  };

  const regenerateFunction = () => {
    setIsThinking(true);
    // Scroll to the second-to-last message
    secondLastMessageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    console.log("Scrolling")
    setTimeout(() => {
      setMessages(prevMessages => prevMessages.slice(0, -1));
      handleSendMessage({ key: 'Enter', ctrlKey: false } as React.KeyboardEvent<HTMLTextAreaElement>, true);
    }, 1000); // Delay to ensure DOM updates

  };

  const onCancel = () => {
    if (abortController.current) {
      abortController.current.abort(); // Abort the ongoing request
      setIsThinking(false); // Stop the thinking state
    }
  };

  useEffect(() => {
    const storedData = localStorage.getItem('characterData');
    if (storedData) {
      setCharacterData(JSON.parse(storedData));
    }
  }, []);

  useEffect(() => {
    if (messages.length === 0 && characterData.initialMessage) {
      setMessages([
        { role: "assistant", content: characterData.initialMessage, stillGenerating: false },
      ]);
    }
  }, [messages, characterData.initialMessage]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
      <div className="grid max-w-[40rem] w-full h-dvh p-2 sm:p-8 font-[family-name:var(--font-geist-sans)] grid-rows-[auto_1fr] gap-4">
        <ChatHeader characterName={characterData.name} />
        <div className="overflow-y-auto overflow-x-hidden">
          <div className="flex flex-col justify-end gap-2 min-h-full">
            <div style={{ height: '60vh'}}></div>
            {messages.map((message, index) => {
              const isSecondLast = index === messages.length - 2;
              return (
                <div
                  key={index}
                  ref={isSecondLast ? secondLastMessageRef : null}
                >
                  <MessageCard
                    role={message.role}
                    content={message.content}
                    stillGenerating={message.stillGenerating}
                    regenerateFunction={regenerateFunction}
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
          handleSendMessage={(e) => {
            handleSendMessage(e, false);
          }}
          onCancel={onCancel}
          isThinking={isThinking}
        />
      </div>
    </div>
  );
};

export default ChatPage;
