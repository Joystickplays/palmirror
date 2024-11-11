"use client";
import { useState, useEffect, useRef } from 'react';
import MessageCard from "@/components/MessageCard";
import ChatHeader from "@/components/ChatHeader";
import MessageInput from "@/components/MessageInput";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { getSystemMessage } from "@/components/systemMessageGeneration"

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

  const abortController = useRef<AbortController | null>(null);

  useEffect(() => {
    const savedBaseURL = localStorage.getItem('Proxy_baseURL');
    const savedApiKey = localStorage.getItem('Proxy_apiKey');
    if (savedBaseURL) setBaseURL(savedBaseURL);
    if (savedApiKey) setApiKey(savedApiKey);

    openai = new OpenAI({
      apiKey: savedApiKey ?? 'none',
      baseURL: savedBaseURL ?? undefined,
      dangerouslyAllowBrowser: true // nothing could possibly go wrong, right
    });
  }, [apiKey, baseURL]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = (e: React.KeyboardEvent<HTMLTextAreaElement>, force: boolean) => {
    if (e.key === 'Enter' && !e.ctrlKey && newMessage.trim() !== "" || force) {
      try { e.preventDefault(); } catch {}

      // Check if a proxy URL is provided (contains https://)
      if (!baseURL.includes('https://')) {
        toast.error("You need to configure your AI provider first in Settings.")
        return
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
        const systemMessageContent = getSystemMessage(characterData)
        const userMessageContent = newMessage ?? "Hello";

        // Create a new AbortController instance for each request
        abortController.current = new AbortController();

        try {
          const comp = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
              { role: "system", content: systemMessageContent, name: "system" },
              ...messages.map(msg => ({ ...msg, name: "-" })),
              { role: "user", content: userMessageContent, name: "user" }
            ],
            stream: true
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
      setIsThinking(true)
      setMessages(prevMessages => prevMessages.slice(0, -1));
      handleSendMessage({ key: 'Enter', ctrlKey: false } as React.KeyboardEvent<HTMLTextAreaElement>, true);
  }

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

  // Scroll to the bottom of the message list whenever a new message is added
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
      <div className="grid max-w-[40rem] w-full h-screen p-2 sm:p-8 font-[family-name:var(--font-geist-sans)] grid-rows-[auto_1fr] gap-4">
        <ChatHeader characterName={characterData.name} />
        <div className="overflow-y-auto overflow-x-hidden">
          <div className="flex flex-col justify-end gap-2 min-h-full">
            {messages.map((message, index) => (
              <MessageCard key={index} role={message.role} content={message.content} stillGenerating={message.stillGenerating} regenerateFunction={regenerateFunction} globalIsThinking={isThinking} isLastMessage={index === messages.length - 1} />
            ))}
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
