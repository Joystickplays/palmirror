// components/MessageCard.tsx
import React, { useCallback } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import ReactMarkdown from 'react-markdown';
import { useSpring, animated } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';

interface MessageCardProps {
  content: string;
  role: string;
  stillGenerating: boolean;
  regenerateFunction: () => void;
  globalIsThinking: boolean;
  isLastMessage: boolean;
}

const vibrate = (dur: number) => {
  if ("vibrate" in navigator) {
    navigator.vibrate(dur)
  }
}

const MessageCard: React.FC<MessageCardProps> = ({ content, role, stillGenerating, regenerateFunction, globalIsThinking, isLastMessage }) => {

  const [{ x, y, scale, height, fontSize }, apiSpring] = useSpring(() => ({ x: 0, y: 0, scale: 1, height: 100, fontSize: 1 }));
  let aboutToRegenerate = false;

  const triggerRegenerate = useCallback(() => {
    regenerateFunction();
    console.log("trigger")
  }, [regenerateFunction]);

  const bind = useDrag(({ down, movement: [mx], velocity: [vx] }) => {
    // const [offsetX, offsetY] = state.offset;

    if (mx < -200 && !globalIsThinking && !stillGenerating && role !== "user" && isLastMessage) {
      if (aboutToRegenerate === false) {
        aboutToRegenerate = true
        vibrate(50);
      }
      apiSpring.start({ x: down ? ((mx >= 0 ? 0.15 * mx : 0.75 * mx) / (role === "user" || stillGenerating || !isLastMessage || globalIsThinking ? 10 : 1)) + -50 : 0, y: 0, scale: .8, height: down ? 80 : 100, config: { tension: 120, friction: 14 } });
    } else {
      aboutToRegenerate = false
      apiSpring.start({ x: down ? ((mx >= 0 ? 0.15 * mx : 0.75 * mx) / (role === "user" || stillGenerating || !isLastMessage || globalIsThinking ? 10 : 1)) : 0, y: 0, scale: 1, height: down ? 80 : 100, config: { tension: 120, friction: 14 } });
    }
    if ((vx < -20 || mx < -200) && !globalIsThinking && !stillGenerating && role !== "user" && isLastMessage && !down) {

      apiSpring.start({
        x: -500,
        y: 0,
        scale: 0,
        height: 0,
        fontSize: 0,
        config: { tension: 120, friction: 14 },
      });
      // trigger a generate after a bit
      setTimeout(triggerRegenerate, 250);
    }
  });

  return (
    <animated.div
      style={{
        x,
        y,
        scale,
        height: height.to(h => `${h}%`),
        fontSize: fontSize.to(s => `${s}rem`),
      }}
      className="flex flex-col justify-end gap-2 min-h-full overflow-hidden"
    >
      <Card
        {...bind()}
        className={`bg-blue-900/20 rounded-xl max-w-lg border-0 grow-0 shrink h-fit touch-none ${role === 'user'
            ? 'bg-blue-950/20 ml-auto rounded-br-md text-end'
            : 'bg-gray-900/10 mr-auto rounded-bl-md'
          }`}
      >
        <CardContent className="p-2 px-4">
          <div className="whitespace-pre-line break-words max-w-full markdown-content overflow-hidden">
            <ReactMarkdown
              className={`${stillGenerating ? 'animate-pulse' : ''}`}
            >
              {content}
            </ReactMarkdown>
          </div>
        </CardContent>
      </Card>
    </animated.div>


  );
};

export default MessageCard;
