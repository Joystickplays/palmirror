import React, { useState, useEffect, useRef } from 'react';
import { encodingForModel } from 'js-tiktoken';


import NumberFlow from '@number-flow/react'

interface TokenCounterProps {
  finalMessagesList: Array<{ role: "user" | "assistant" | "system"; content: string; stillGenerating: boolean }>
  tokenCount: number;
}


const TokenCounter: React.FC<TokenCounterProps> = ({
  finalMessagesList,
  tokenCount
}) => {


  const [accurateTokenizer, setAccurateTokenizer] = useState(true); // toggle it yourself .
  const [tokenCount, setTokenCount] = useState(0);
  const [displayCount, setDisplayCount] = useState(tokenCount);

  const tokenizer = encodingForModel('gpt-3.5-turbo');

  const estimateTokens = (messages: Array<{ role: "user" | "assistant" | "system"; content: string; stillGenerating: boolean }>): number => {
    const allText = messages.map(item => item.content).join(' ');
    return Math.floor(allText.length);
  }

  const countTokens = (messages: Array<{ role: "user" | "assistant" | "system"; content: string; stillGenerating: boolean }>): number => {
    if (accurateTokenizer) {
    return messages.reduce((total, message) => {
      const tokens = tokenizer.encode(message.content); // Encoding each message
      return total + tokens.length;
    }, 0);
    } else {
      return estimateTokens(messages)
    }
  };

  
  const throttledCountTokens = useThrottle(() => {
    const totalTokens = countTokens(finalMessagesList);
    setTokenCount(totalTokens);
  }, 1000);

  useEffect(() => {
    throttledCountTokens();
  }, [finalMessagesList, throttledCountTokens]);  

  const throttledDisplayCount = useThrottle(() => {
    setDisplayCount(tokenCount);
  }, 1000);

  useEffect(() => {
    throttledDisplayCount();
  }, [tokenCount, throttledDisplayCount]);  
  

  return (
    <p className="text-[0.3rem] opacity-50 font-mono absolute top-0 left-1/2 transform -translate-x-1/2 p-2">
      tokens <NumberFlow value={displayCount}></NumberFlow>
    </p>
  );
};

export default TokenCounter;

