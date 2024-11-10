"use client";
import { useState, useEffect, useRef } from 'react';
import MessageCard from "@/components/MessageCard";
import ChatHeader from "@/components/ChatHeader";
import MessageInput from "@/components/MessageInput";


import OpenAI from "openai";

let openai: OpenAI

const ChatPage = () => {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [characterData, setCharacterData] = useState({
    name: '',
    personality: '',
    initialMessage: '',
    scenario: '',
  });
  const [newMessage, setNewMessage] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const [baseURL, setBaseURL] = useState('');
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    const savedBaseURL = localStorage.getItem('Proxy_baseURL');
    const savedApiKey = localStorage.getItem('Proxy_apiKey');
    if (savedBaseURL) setBaseURL(savedBaseURL);
    if (savedApiKey) setApiKey(savedApiKey);


    openai = new OpenAI({
      apiKey: savedApiKey ?? undefined,
      baseURL: savedBaseURL ?? undefined,
      dangerouslyAllowBrowser: true // nothing could possibly go wrong right
    });
  }, [apiKey, baseURL]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.ctrlKey && newMessage.trim() !== "") {      
      try { e.preventDefault(); } catch {}
      setIsThinking(true);

      // Add user message
      setMessages(prevMessages => [
        ...prevMessages,
        { role: 'user', content: newMessage }
      ]);      

      setNewMessage('');
      textareaRef.current?.focus();

      const sendMessage = async () => {
        const systemMessageContent = `${characterData.name ?? "Character"}'s personality: ${characterData.personality ?? "No personality provided"}`;
        const userMessageContent = newMessage ?? "Hello";

        const comp = await openai.chat.completions.create({
          messages: [
            { role: "system", content: systemMessageContent },
            ...messages as any,
            { role: 'user', content: userMessageContent }
          ],
          model: "gpt-3.5-turbo",
        });
      
        const assistantMessage = comp.choices[0].message.content ?? ""; // Use empty string if content is null
        setMessages(prevMessages => [
          ...prevMessages,
          { role: 'assistant', content: assistantMessage }
        ]);
        setIsThinking(false);
      }
      
      sendMessage();
      
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
        { role: 'assistant', content: characterData.initialMessage },
      ]);
    }
  }, [messages, characterData.initialMessage]);

  // Scroll to the bottom of the message list whenever a new message is added
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="grid place-items-center">
      <div className="grid max-w-[40rem] w-full h-screen p-8 font-[family-name:var(--font-geist-sans)] grid-rows-[auto_1fr] gap-4">
        <ChatHeader characterName={characterData.name} />
        <div className="overflow-y-auto">
          <div className="flex flex-col justify-end gap-2 min-h-full">
            {messages.map((message, index) => (
              <MessageCard key={index} role={message.role} content={message.content} />
            ))}
            <div ref={messageEndRef} />
          </div>
        </div>
        <MessageInput
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          handleSendMessage={handleSendMessage}
          isThinking={isThinking}
        />
      </div>
    </div>
  );
};

export default ChatPage;
