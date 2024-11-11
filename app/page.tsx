"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [characterData, setCharacterData] = useState({
    name: "",
    personality: "",
    initialMessage: "",
    scenario: "",
  });

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: keyof typeof characterData) => {
    const value = event.target.value;
    setCharacterData({ ...characterData, [field]: value });
  };

  const startChat = () => {
    if (!characterData.name || !characterData.personality || !characterData.initialMessage) {
      toast.error('Please fill in all required fields (name, personality, first message).');
      return;
    }

    localStorage.setItem('characterData', JSON.stringify(characterData));
    toast.success('Character data saved! Starting chat...');
    router.push('/chat');
  };

  return (
    <div className="grid items-center justify-items-center content-center min-h-screen p-8 pb-20 gap-4 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl pb-2">
        PalMirror
      </h1>

      <div className="pb-7">
        <Dialog>
          <DialogTrigger asChild>
            <Button>Setup character</Button>
          </DialogTrigger>
          <DialogContent className="w-auto max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Setup character</DialogTitle>
              <div className="py-4">
                <div className="grid w-full items-center gap-1.5 w-80">
                  <Label htmlFor="charName">Character name <span className="text-red-500">*</span></Label>
                  <Input id="charName" value={characterData.name} onChange={(e) => handleInputChange(e, 'name')} />
                </div>
              </div>
              <div className="py-4">
                <div className="grid w-full items-center gap-1.5 w-80">
                  <Label htmlFor="charPersonality">Personality <span className="text-red-500">*</span></Label>
                  <Textarea id="charPersonality" value={characterData.personality} onChange={(e) => handleInputChange(e, 'personality')} />
                </div>
              </div>
              <div className="py-4">
                <div className="grid w-full items-center gap-1.5 w-80">
                  <Label htmlFor="charInitialMessage">First message <span className="text-red-500">*</span></Label>
                  <Textarea id="charInitialMessage" value={characterData.initialMessage} onChange={(e) => handleInputChange(e, 'initialMessage')} />
                </div>
              </div>
              <div className="py-4">
                <div className="grid w-full items-center gap-1.5 w-80">
                  <Label htmlFor="charScenario">Scenario</Label>
                  <Input id="charScenario" value={characterData.scenario} onChange={(e) => handleInputChange(e, 'scenario')} />
                </div>
              </div>
              <Button className="w-80" onClick={startChat}>Start chat</Button>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
      <p className="text-sm opacity-40">PalMirror does NOT claim ownership of any given character. PalMirror does not store your chats.</p>

      <ToastContainer
        position="top-right"
        autoClose={5000}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        theme="dark"
      />
    </div>
  );
}
