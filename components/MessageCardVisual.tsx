// components/MessageCardDisplayOnly.tsx
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import ReactMarkdown from 'react-markdown';
import { useTheme } from '@/components/PalMirrorThemeProvider';
import { CharacterData } from "@/types/CharacterData";
import TypingIndication from "@/components/Typing";
import { animated, useSpring } from '@react-spring/web';

interface MessageCardDisplayOnlyProps {
  content: string;
  role: string;
  stillGenerating: boolean;
  characterData: CharacterData;
}

const cleanMessage = (content: string, characterData: CharacterData): string => {
  try {
    return content
      .replace(/\{\{user\}\}/g, characterData.userName || "Y/N")
      .replace(/\{\{char\}\}/g, characterData.name || "C/N")
      .replace(/---\s*STATUS:([\s\S]*?)(?:\n\n|$)/gi, "")
      .replace(/<[^>]+>/g, "")
      .trim();
  } catch {
    return content;
  }
};

const MessageCardDisplayOnly: React.FC<MessageCardDisplayOnlyProps> = ({
  content,
  role,
  stillGenerating,
  characterData,
}) => {
  const { getTheme } = useTheme();
  const currentTheme = getTheme();

  const [{ fontSize }] = useSpring(() => ({
    fontSize: 1,
    config: { tension: 180, friction: 18 },
  }));

  const cleanedContent = cleanMessage(content, characterData);

  return (
    <animated.div
      className="flex flex-col justify-end min-h-full overflow-hidden"
      style={{
        fontSize: fontSize.to(s => `${s}rem`),
        marginTop: fontSize.to(s => `${s / 2}rem`),
      }}
    >
      <animated.p
        className={`${role === "user" ? "ml-auto" : "mr-auto"} opacity-50`}
        style={{ fontSize: fontSize.to(s => `${s / 1.5}rem`) }}
      >
        {role === "user"
          ? `${currentTheme.showUserName ? characterData.userName || "Y/N" : ""}`
          : characterData.name || "Character"}
      </animated.p>

      <Card
        className={`rounded-xl sm:max-w-lg max-w-full w-fit border-0 grow-0 shrink h-fit touch-pan-y ${
          role === "user"
            ? `${currentTheme.userBg} ml-auto rounded-br-md text-end`
            : `${currentTheme.assistantBg} mr-auto rounded-bl-md`
        }`}
      >
        <CardContent className="p-0">
          <animated.div
            className="whitespace-pre-line break-words max-w-full markdown-content overflow-hidden"
            style={{
              padding: fontSize.to(s => `${s / 2}rem`),
              paddingLeft: fontSize.to(s => `${s}rem`),
              paddingRight: fontSize.to(s => `${s}rem`),
            }}
          >
            {stillGenerating && cleanedContent.length < 1 ? (
              <TypingIndication />
            ) : (
              <ReactMarkdown className={`${stillGenerating ? "animate-pulse" : ""} select-none opacity-95`}>
                {cleanedContent}
              </ReactMarkdown>
            )}
          </animated.div>
        </CardContent>
      </Card>
    </animated.div>
  );
};

export default MessageCardDisplayOnly;
