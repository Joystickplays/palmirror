import React, { useEffect } from "react";
import KeypadButton from "@/components/keypad/KeypadButton";

interface KeypadProps {
  onKeyPress: (key: string) => void;
  fromBottom: boolean;
}

const keys = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["0", "⌫"],
];

const staggerGroups: string[][] = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["0", "⌫"],
];

const getDelay = (key: string) => {
  for (let i = 0; i < staggerGroups.length; i++) {
    if (staggerGroups[i].includes(key)) return i * 0.04;
  }
  return 0;
};

const Keypad: React.FC<KeypadProps> = ({ onKeyPress, fromBottom }) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key;

      if (/^[0-9]$/.test(key)) {
        onKeyPress(key);
        event.preventDefault();
      }
      else if (key === "Backspace") {
        onKeyPress("⌫");
        event.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onKeyPress]);

  return (
    <div className="grid grid-cols-3 gap-3 mt-5 w-fit block mx-auto">
      {keys.flat().map((key) => (
        <KeypadButton
          key={key}
          btn={key}
          delay={getDelay(key)}
          onKeyPress={onKeyPress}
          fromBottom={fromBottom}
        />
      ))}
    </div>
  );
};

export default Keypad;
