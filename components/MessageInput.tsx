// components/MessageInput.tsx
import React from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, OctagonX } from 'lucide-react';

interface MessageInputProps {
  newMessage: string;
  setNewMessage: React.Dispatch<React.SetStateAction<string>>;
  handleSendMessage: (e: React.KeyboardEvent<HTMLTextAreaElement> | null) => void; // Updated to handle both keyboard and button click
  onCancel: () => void;        
  isThinking: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ newMessage, setNewMessage, handleSendMessage, onCancel, isThinking }) => {
  const handleButtonClick = () => {
    if (isThinking) {
      onCancel();
    } else {
      // Create a mock KeyboardEvent with the Enter key when the button is clicked
      handleSendMessage({ key: 'Enter', ctrlKey: false } as React.KeyboardEvent<HTMLTextAreaElement>);
    }
  };

  return (
    <div className="relative w-full">
      <Textarea
        id="Message"
        className="w-full p-2"
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        onKeyDown={(e) => handleSendMessage(e)}
      />
      <Button
        className="absolute right-2 bottom-2 p-2"
        onClick={handleButtonClick} 
      >
        {isThinking ? (
          <OctagonX className="animate-pulse" />
        ) : (
          <Send />
        )}
      </Button>      
    </div>
  );
};

export default MessageInput;
