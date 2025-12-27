// components/ChatHeader.tsx
import React, { useEffect, useState, useContext } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTheme } from '@/context/PalMirrorThemeProvider';
import { Settings } from 'lucide-react';
import { CharacterData } from "@/types/CharacterData";
import { useRouter } from 'next/navigation';
import { PLMSecureContext } from '@/context/PLMSecureContext';
import dynamic from 'next/dynamic'
import { motion } from 'motion/react';
import { usePLMGlobalConfig } from '@/context/PLMGlobalConfig';

const ChatSettings = dynamic(() => import('./ChatSettings'), { ssr: false })

interface ChatHeaderProps {
  characterData: CharacterData;
  fromDomain: boolean;
  getExportedMessages: () => void;
  importMessages: () => void;
  visible: boolean;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ characterData, fromDomain, getExportedMessages, importMessages, visible }) => {
  const PLMGC = usePLMGlobalConfig();
  const [configHighend, setConfigHighend] = useState(false);
  useEffect(() => {
    setConfigHighend(!!PLMGC.get("highend"))
  }, [])
  
  const [showPMSysInstSuggestion, setShowPMSysInstSuggestion] = useState(true);

  const PLMSecContext = useContext(PLMSecureContext);

  const { theme, getTheme, setTheme } = useTheme();
  const currentTheme = getTheme();
  const router = useRouter();

  useEffect(() => {
    if (localStorage.getItem("PMPSIDontShowAgain")) {
      setShowPMSysInstSuggestion(false)
    }
  }, [])
  return (
    <motion.div 
    animate={visible ? {
      y: 0,
      opacity: 1,
      filter: 'blur(0px)'
    } : {
      y: -10,
      opacity: 0.1,
      filter: configHighend ? 'blur(5px)' : 'blur(0px)'
    }}
    transition={{ type: 'spring', mass: 1, stiffness: 160, damping: 26 }}
    className={`border border-white/10 rounded-xl absolute inset-1 md:inset-6 box-border h-fit ${currentTheme.bg} overflow-hidden p-5 z-10`}>

      <CardContent className={`flex justify-between items-center ${currentTheme.bg} overflow-hidden p-0`}>

        {characterData.image !== "" && (
          <img src={characterData.image !== "" ? characterData.image : undefined}
            style={{ maskImage: 'linear-gradient(to right, rgba(0, 0, 0, 0.3), transparent)' }}
            className="absolute inset-0 top-0 left-0 right-0 bottom-0 w-full h-full object-cover rounded-lg object-[50%_35%] blur-[3px] hover:blur-none active:blur-none scale-110 hover:scale-100 active:scale-100 transition duration-300 ease-out" />
        )}
        <div className="flex gap-1 flex-col">
          <h2 className="z-2"><span className={`font-bold ${fromDomain && "palmirror-exc-text"}`}>{characterData.name}</span></h2>
          <p className="text-xs font-bold opacity-50">On PalMirror {fromDomain && "Experience"}</p>
        </div>

        <ChatSettings getExportedMessages={getExportedMessages} importMessages={importMessages} />

      </CardContent>
    </motion.div>
  );
};

export default ChatHeader;
