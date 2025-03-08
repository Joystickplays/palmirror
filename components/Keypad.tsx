import React from "react";
import KeypadButton from "@/components/KeypadButton";

interface KeypadProps {
  onKeyPress: (key: string) => void;
}

const keys = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["0", "⌫"],
];

const staggerGroups: string[][] = [
  ["0", "⌫"],
  ["7", "8", "9"],
  ["4", "5", "6"],
  ["1", "2", "3"],
  //["1", "3"],
];

const getDelay = (key: string) => {
  for (let i = 0; i < staggerGroups.length; i++) {
    if (staggerGroups[i].includes(key)) return i * 0.05;
  }
  return 0;
};

const Keypad: React.FC<KeypadProps> = ({ onKeyPress }) => {
  return (
    <div className="grid grid-cols-3 gap-3 mt-5 w-fit block mx-auto">
      {keys.flat().map((key) => (
        <KeypadButton key={key} btn={key} delay={getDelay(key)} onKeyPress={onKeyPress} />
      ))}
    </div>
  );
};

export default Keypad;
