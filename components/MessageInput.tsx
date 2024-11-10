// components/MessageInput.tsx
import React from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send } from 'lucide-react';

interface MessageInputProps {
  newMessage: string;
  setNewMessage: React.Dispatch<React.SetStateAction<string>>;
  handleSendMessage: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  isThinking: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ newMessage, setNewMessage, handleSendMessage, isThinking }) => {
  return (
    <div className="relative w-full">
      <Textarea
        id="Message"
        className="w-full p-2"
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        onKeyDown={handleSendMessage}
      />
      <Button disabled={isThinking} className="absolute right-2 bottom-2 p-2" onClick={() => handleSendMessage({ key: 'Enter' } as React.KeyboardEvent<HTMLTextAreaElement>)}>
        <Send />
      </Button>
    </div>
  );
};

export default MessageInput;
