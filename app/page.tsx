"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ToastContainer, toast } from 'react-toastify';
import { CircleHelp } from 'lucide-react';
import 'react-toastify/dist/ReactToastify.css';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"


import { useRouter } from 'next/navigation';

export default function Home() {
  const loadCharacterData = () => {
    const storedData = localStorage.getItem('characterData');
    if (storedData) {
      setCharacterData(JSON.parse(storedData));
    }
  };


  const router = useRouter();
  const [characterData, setCharacterData] = useState({
    name: "",
    personality: "",
    initialMessage: "",
    scenario: "",
    userName: "",
    userPersonality: "",
    alternateInitialMessages: [] as Array<string>
  });
  const [linkChar, setLinkChar] = useState('')

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: keyof typeof characterData) => {
    const value = event.target.value;
    setCharacterData({ ...characterData, [field]: value });
  };

  useEffect(() => {
    loadCharacterData();
  }, []);


  const startChat = () => {
    if (!characterData.name || !characterData.personality || !characterData.initialMessage) {
      toast.error('Please fill in all required fields (name, personality, first message).');
      return;
    }

    localStorage.setItem('characterData', JSON.stringify(characterData));
    toast.success('Character data saved! Starting chat...');
    router.push('/chat');
  };

  const getCharacterId = (url: string): string | null => {
    const match = url.match(/\/chat\/([^\/?]+)/);
    return match ? match[1] : null;
  };

  const getChubCharacterAuthor = (url: string): string | null => {
    const match = url.match(/\/characters\/([^\/?]+)/);
    return match ? match[1] : null;
  };

  const getChubCharacterId = (url: string, author: string): string | null => {
    const match = url.match(new RegExp(`/${author}/([^/?)]+)`));
    return match ? match[1] : null;
  };


  const getCaiInfo = () => {
    toast("Getting character...")
    const fetchCaiData = async () => {
      try {
        const response = await fetch(`/api/charai?char=${getCharacterId(linkChar)}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        const { name, personality, initialMessage, ...rest } = characterData;

        setCharacterData(() => {
          const updatedData = {
            ...rest,
            name: data.character.name,
            personality: data.character.definition,
            initialMessage: data.character.greeting,
          };
          localStorage.setItem('characterData', JSON.stringify(updatedData));
          toast.success(`${data.character.name} fetched from c.ai!`);
          return updatedData;
        });

        router.push("/chat");
      } catch (error) {
        toast.error(`Failed to fetch character data from c.ai: ${error}`);
      }
    };

    if (linkChar) {
      fetchCaiData();
    }

  }

  const getChubaiInfo = () => {
    toast("Getting character...")
    const fetchChubaiData = async () => {
      try {
        const authorName = getChubCharacterAuthor(linkChar)
        const response = await fetch(`https://api.chub.ai/api/characters/${authorName}/${getChubCharacterId(linkChar, authorName || "")}?full=true`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        const { name, personality, initialMessage, ...rest } = characterData;

        setCharacterData(() => {
          const updatedData = {
            ...rest,
            name: data.node.definition.name,
            personality: data.node.definition.personality || data.node.definition.description,
            initialMessage: data.node.definition.first_message,
            alternateInitialMessages: data.node.definition.alternate_greetings && [data.node.definition.first_message, ...data.node.definition.alternate_greetings] || [],
            scenario: data.node.definition.scenario,
          };
          localStorage.setItem('characterData', JSON.stringify(updatedData));
          toast.success(`${data.node.definition.name} fetched from chub.ai!`);
          return updatedData;
        });

        router.push("/chat");
      } catch (error) {
        toast.error(`Failed to fetch character data from chub.ai: ${error}`);
      }
    };

    if (linkChar) {
      fetchChubaiData();
    }

  }

  return (
    <div className="grid items-center justify-items-center content-center min-h-screen p-8 pb-20 gap-4 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <h1 className="scroll-m-20 text-1xl font-extrabold tracking-tight lg:text-3xl pb-2">
        PalMirror
      </h1>
      <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight lg:text-5xl pb-2 text-center w-4/5">
        Talk with your favorite characters—just with a bit more <em>style</em>
      </h1>

      <div className="pb-7">
        <div className="flex justify-items-center items-center flex-col sm:flex-row gap-2 sm:gap-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button>Get from a platform</Button>
            </DialogTrigger>
            <DialogContent className="w-full max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Get from a platform</DialogTitle>
              </DialogHeader>
              <Input value={linkChar} onChange={(e) => setLinkChar(e.target.value)} placeholder="Character link (Characters with public definitions are recommended)" />
              <div className="flex justify-items-center items-center gap-4">
                <Button onClick={getCaiInfo}>Get from c.ai</Button>
                <Button onClick={getChubaiInfo}>Get from chub.ai</Button>
              </div>
            </DialogContent>
          </Dialog>
          <em >or</em>
          <Popover>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="mx-auto">Setup character</Button>
              </DialogTrigger>
              <DialogContent className="w-auto max-h-[80vh] overflow-y-auto font-sans">
                <DialogHeader>
                  <DialogTitle>Setup character</DialogTitle>
                  <div className="palmirror-exc rounded-lg p-3 !my-4">
                    <div className="flex justify-center items-center">
                      <h1 className="text-2xl !font-extrabold tracking-tight text-center w-full palmirror-exc-text text-center">
                        PalMirror Experience
                      </h1>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <CircleHelp />
                        </Button>
                      </PopoverTrigger>
                    </div>
                    <div className="flex justify-center items-center gap-2 !mt-2">
                      <Button variant="palmirror" onClick={() => {router.push("/palexp/create")}}>Create</Button>
                      <Button variant="palmirror">Import from file</Button>
                    </div>
                  </div>
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
                  <Accordion type="single" collapsible className="w-full mb-4">
                    <AccordionItem value="item-1">
                      <AccordionTrigger>Your personality</AccordionTrigger>
                      <AccordionContent>
                        <div className="py-4">
                          <div className="grid w-full items-center gap-1.5 w-80">
                            <Label htmlFor="userName">Your name</Label>
                            <Input id="userName" value={characterData.userName} onChange={(e) => handleInputChange(e, 'userName')} />
                          </div>
                        </div>
                        <div className="py-4">
                          <div className="grid w-full items-center gap-1.5 w-80">
                            <Label htmlFor="userPersonality">Your personality</Label>
                            <Textarea id="userPersonality" value={characterData.userPersonality} onChange={(e) => handleInputChange(e, 'userPersonality')} />
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                  <Button className="w-80" onClick={startChat}>Start chat</Button>
                </DialogHeader>
              </DialogContent>
            </Dialog>
            <PopoverContent asChild className="z-[999999] min-w-80">
              <p>PalMirror-exclusive characters with customizable traits and reactions. Adjust their emotions and status in real-time as they react to your changes, triggering sounds and effects. More features are being worked out for PalMirror Experience characters.</p>
            </PopoverContent>
          </Popover>

        </div>
        {/* <hr className="my-4"></hr>
          <div className="flex justify-center items-center">
          </div> */}
      </div>
      <p className="text-sm opacity-40 text-center">PalMirror does NOT claim ownership of any given character. PalMirror does not store your chats.</p>
      <p className="text-sm opacity-40 text-center">An <u><a href="https://github.com/Joystickplays/palmirror">open-source</a></u> project by GoTeam</p>

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
