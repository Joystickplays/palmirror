'use client';

import { motion, LayoutGroup } from 'framer-motion';
import { useState } from 'react';

export default function SorceryDemo() {
  const [items, setItems] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = () => {
    if (!input.trim()) return;
    setIsAdding(true);

    // Delay a bit so the preview animation shows
    setTimeout(() => {
      setItems((prev) => [...prev, input]);
      setInput('');
      setIsAdding(false);
    }, 200);
  };

  return (
    <LayoutGroup>
      <div className="relative max-w-md mx-auto p-4">
        {/* Item List */}
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <motion.div
              layoutId={`item-${item}`}
              key={item}
              className="bg-blue-400 text-white px-4 py-2 rounded-lg shadow"
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              {item}
            </motion.div>
          ))}
        </div>

        {/* Input Area */}
        <div className="flex items-center gap-2 mt-6">
          <input
            className="border border-blue-400 px-3 py-2 rounded w-full"
            placeholder="Type an item..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
            onClick={handleAdd}
          >
            Insert
          </button>
        </div>

        {/* Magic Ghost Preview */}
        {isAdding && input && (
          <motion.div
            layoutId={`item-${input}`}
            className="absolute left-4 bottom-[4.5rem] bg-blue-400 text-white px-4 py-2 rounded-lg shadow pointer-events-none opacity-70"
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            {input}
          </motion.div>
        )}
      </div>
    </LayoutGroup>
  );
}