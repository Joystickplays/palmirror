import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import ReactMarkdown from 'react-markdown';
import { useTheme } from '@/components/PalMirrorThemeProvider';

interface VisualMessageCardProps {
  content: string;
  role: 'user' | 'assistant';
  characterName?: string;
}

const VisualMessageCard: React.FC<VisualMessageCardProps> = ({ content, role, characterName }) => {
  const { getTheme } = useTheme();
  const theme = getTheme();

  const containerClass = role === 'user'
    ? `${theme.userBg} ml-auto rounded-br-md text-end`
    : `${theme.assistantBg} mr-auto rounded-bl-md`;

  return (
    <Card className={`rounded-xl sm:max-w-lg max-w-full w-fit border-0 grow-0 shrink h-fit touch-pan-y ${role === "user"} ${containerClass}`}>  
      <CardContent className="p-4 py-2">
        {characterName && (
          <p className="opacity-50 text-sm mb-2">
            {role === 'user' ? characterName : 'Character'}
          </p>
        )}
        <div className="markdown-content">
          <ReactMarkdown>
            {content}
          </ReactMarkdown>
        </div>
      </CardContent>
    </Card>
  );
};

export default VisualMessageCard;
