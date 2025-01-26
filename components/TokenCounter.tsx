import React, { useState, useEffect, useRef } from 'react';


import NumberFlow from '@number-flow/react'

interface TokenCounterProps {
  tokenCount: number;
}


const TokenCounter: React.FC<TokenCounterProps> = ({
  tokenCount
}) => {


  

  
  

  return (
    <p className="text-[0.3rem] opacity-50 font-mono absolute top-0 left-1/2 transform -translate-x-1/2 p-2">
      tokens <NumberFlow value={tokenCount}></NumberFlow>
    </p>
  );
};

export default TokenCounter;

