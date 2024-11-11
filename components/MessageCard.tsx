// components/MessageCard.tsx
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import ReactMarkdown from 'react-markdown';

interface MessageCardProps {
  content: string;
  role: string;
  stillGenerating: boolean;
}

const MessageCard: React.FC<MessageCardProps> = ({ content, role, stillGenerating }) => {
  return (
    <Card className={`bg-blue-900/20 rounded-xl max-w-lg border-0 grow-0 shrink h-fit ${role === 'user' ? 'bg-blue-950/20 ml-auto rounded-br-md text-end' : 'bg-gray-900/10 mr-auto rounded-bl-md'}`}>
      <CardContent className="p-2 px-4">
        <div className="whitespace-pre-line break-words max-w-full markdown-content">
          <ReactMarkdown className={`${stillGenerating ? 'animate-pulse' : ''}`}>{content}</ReactMarkdown>
        </div>
      </CardContent>
    </Card>
  );
};

export default MessageCard;
