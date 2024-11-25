// components/MessageInput.tsx
import React from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, OctagonX, MessageSquareQuote, PenLine } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"

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
      <ContextMenu>
        <ContextMenuTrigger asChild>
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
        </ContextMenuTrigger>
        <ContextMenuContent className="w-64 font-sans font-semibold">
          <ContextMenuItem  disabled={isThinking} asChild>
            <span className="flex items-center gap-2">
              <MessageSquareQuote className="h-4 w-4" />
              Suggest a reply
            </span>
          </ContextMenuItem>
          <ContextMenuItem disabled={isThinking} asChild>
            <span className="flex items-center gap-2">
              <PenLine className="h-4 w-4" />
              Rewrite message
            </span>
          </ContextMenuItem>
        </ContextMenuContent>

      </ContextMenu>
         
    </div>
  );
};

export default MessageInput;
