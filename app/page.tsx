"use client";

import { useState, useEffect, useRef, useContext, useCallback, useLayoutEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToastContainer, toast } from "react-toastify";
import { CircleHelp, ArrowRight, Trash2, Earth, Settings, LayoutTemplate, Plus } from "lucide-react";
import "react-toastify/dist/ReactToastify.css";

import Keypad from "@/components/Keypad";
import PinDisplay from "@/components/PINDisplay";

import UserPersonalities from "@/components/UserPersonalities";

import NumberFlow, { NumberFlowGroup } from "@number-flow/react";

import { AnimatePresence, motion, useAnimation } from "motion/react";

import pako from "pako";

import { CharacterData, defaultCharacterData } from "@/types/CharacterData";
interface ChatMetadata extends CharacterData {
    id: string;
    lastUpdated: string;
    associatedDomain?: string;
    entryTitle?: string;
}


import { usePalRec } from "@/context/PLMRecSystemContext" 
import { PLMSecureContext } from "@/context/PLMSecureContext";
import { isPalMirrorSecureActivated } from "@/utils/palMirrorSecureUtils";
import { charPalExpScript } from "@/utils/gPECMini";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"


import { useRouter } from "next/navigation";

import { useDebounce } from "@/utils/useDebounce";

import { AnimateChangeInHeight } from "@/components/AnimateHeight";

import discord from "@/public/discord.svg"
import { PLMGlobalConfigServiceInstance } from "@/context/PLMGlobalConfigService";
import { usePMNotification } from "@/components/notifications/PalMirrorNotification";

/* eslint-disable @typescript-eslint/no-explicit-any */
  function sortByLastUpdated(
    data: ChatMetadata[]
  ): ChatMetadata[] {
    return data.sort(
      (a, b) =>
        new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    );
  }


const formatDateWithLocale = (dateInput: string | Date): string => {
    const date = new Date(dateInput); // Ensure the input is a Date object

    if (isNaN(date.getTime())) {
      throw new Error("Invalid Date");
    }

    const options: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true, // Ensures am/pm format
      month: "long",
    };

    const time = date.toLocaleString("en-US", options); // Get time in "hh:mm am/pm" format
    const day = String(date.getDate()).padStart(2, "0"); // Ensure day is 2 digits
    const month = date.toLocaleString("en-US", { month: "long" }); // Month name (e.g., "January")

    return `${day} ${time}`;
  };

function getScreenCenterOrigin(element: HTMLDivElement) {
    const rect = element.getBoundingClientRect();
    const centerX = window.innerWidth / 2.2;
    const centerY = window.innerHeight / 2;

    const originX = centerX - rect.left;
    const originY = centerY - rect.top;

    console.log(originX, originY)

    return `${originX}px ${originY}px`
}

const cardDelays: number[] = [
  200, 100, 200,
  100, 0, 100,
  200, 100, 200,
];

function ChatCard({
  chat,
  index,
  PLMsecureContext,
  setChatList,
  router,
}: {
  chat: ChatMetadata;
  index: number;
  PLMsecureContext: any;
  setChatList: any;
  router: any;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const setAlready = useRef(false)
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    if (ref.current && !setAlready.current && PLMGlobalConfigServiceInstance.get("cardFlyIn")) {
      if (window.innerWidth > 1080) {
        ref.current.style.transformOrigin = getScreenCenterOrigin(ref.current);
      }
      setAlready.current = true

      setTimeout(() => {
        setSettled(true);
        console.log('sett')
      }, 1200)
    }
  }, []);

  if (chat.associatedDomain) return null;

  return (
    <motion.div
      ref={ref}
      initial={
        (
          window.innerWidth < 640
            ? index < 6
            : PLMGlobalConfigServiceInstance.get("cardFlyIn")
              ? true
              : index < 9
        )
          ? (
            window.innerWidth < 640
              ? {
                opacity: 0,
                scale: 0.7,
                y: -600,
                filter: PLMGlobalConfigServiceInstance.get("highend") ? "blur(50px)" : ""
              }
              : PLMGlobalConfigServiceInstance.get("cardFlyIn")
                ? {
                  opacity: 0,
                  scale: 1.5
                }
                : {
                  opacity: 0,
                  scale: 0.7,
                  y: -600,
                  filter: PLMGlobalConfigServiceInstance.get("highend") ? "blur(50px)" : ""
                }
          )
          : {
            opacity: 0,
            scale: 1.2
          }
      }
      animate={{
        opacity: 1,
        scale: 1,
        y: 0,
        filter: "blur(0px)",
      }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={ PLMGlobalConfigServiceInstance.get("cardFlyIn") && window.innerWidth > 640 ? {
        delay: window.innerWidth > 1080 ? (cardDelays[index] ?? 0) / 1500 : index * 0.05,
        type: "spring",
        duration: 1.2 - (cardDelays[index] ?? 0) / 1500,
        bounce: 0.3,
        restDelta: 0.001,
      } : {
        delay: index * 0.05,
        type: "spring",
        mass: 1,
        damping: 27,
        stiffness: 161,
        restDelta: 0.001,
        filter: { duration: 0.3 + index * 0.1, },
        y: {
          type: "spring",
          mass: 1,
          damping: 17,
          stiffness: 97,
          delay: index * 0.05,
        },
      }}
      key={chat.lastUpdated}
      className={`flex flex-col gap-1.5 p-6 border rounded-xl h-full ${
        chat.plmex.domain?.active && "palmirror-exc"
      }`}
      layout={PLMGlobalConfigServiceInstance.get("cardFlyIn") ? settled : true}
    >
      {chat.image && (
        <div>
          <img
            src={chat.image}
            className="absolute inset-0 top-0 left-0 right-0 bottom-0 w-[200px] h-full rounded-xl object-cover object-[50%_30%] pointer-events-none"
            style={{
              maskImage:
                "linear-gradient(to right, rgba(0, 0, 0, 1), transparent)",
            }}
          />
        </div>
      )}

      <h2
        className={`font-bold ml-auto ${
          chat.plmex.domain?.active && "palmirror-exc-text"
        }`}
      >
        {chat.name}
      </h2>

      <p className="opacity-70 ml-auto text-xs">
        {formatDateWithLocale(chat.lastUpdated)}
      </p>

      <div className="flex justify-end gap-2">
        {!chat.plmex.domain?.active && (
          <Button
            variant="outline"
            onClick={() => {
              PLMsecureContext?.removeKey(chat.id);
              PLMsecureContext?.removeKey(`METADATA${chat.id}`);
              setChatList((prevList: any) =>
                prevList.filter((item: any) => item.id !== chat.id)
              );
            }}
          >
            <Trash2 />
          </Button>
        )}

        <Button
          variant="outline"
          onClick={() => {
            sessionStorage.setItem("chatSelect", chat.id);

            if (chat.plmex.domain?.active) {
              router.push("/experience/domain");
              return;
            }
            router.push(`/chat`);
          }}
        >
          {chat.plmex.domain?.active ? "Enter" : "Continue"} <ArrowRight />
        </Button>
      </div>
    </motion.div>
  );
}

/* eslint-enable @typescript-eslint/no-explicit-any */

function GetFromPlatform({
  router,
  linkChar,
  setLinkChar,
  getChubaiInfo,
  iconForm,
}: {
  router: ReturnType<typeof useRouter>;
  linkChar: string;
  setLinkChar: React.Dispatch<React.SetStateAction<string>>;
  getChubaiInfo: () => void;
  iconForm?: boolean;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {
          iconForm ? (<Button size="icon" variant="ghost" className="p-1 rounded-full"><LayoutTemplate className="w-6! h-6!" /></Button>) : (<Button>Get from a platform</Button>)
        }
      </DialogTrigger>
      <DialogContent className="w-full max-h-[80vh] overflow-y-auto flex flex-col gap-2 font-sans">
        <DialogHeader className="mb-2">
          <DialogTitle>Get from a platform</DialogTitle>
        </DialogHeader>
        <Button className="w-full" onClick={() => router.push("/search")}>
          Search for a character
        </Button>
        <hr />
        <Input
          value={linkChar}
          onChange={(e) => setLinkChar(e.target.value)}
          placeholder="Character link..."
        />
        <div className="flex justify-items-center items-center gap-4">
          <Button onClick={getChubaiInfo}>Get from chub.ai</Button>
        </div>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>Get from other platforms</AccordionTrigger>
            <AccordionContent>
              <div className="py-2 flex flex-col gap-2">
                <p>
                  PalMirror cannot automatically get characters from other
                  platforms for you.
                </p>
                <p>
                  However, you can get them yourself and get the PalMirror
                  Experience variant for the character you want.
                </p>
                <div className="p-4 rounded-xl border flex flex-col gap-4">
                  <div>
                    <h2 className="text-lg font-bold">Step 1</h2>
                    <p>Copy this script below.</p>
                    <div className="flex gap-2 mt-2">
                      <code className="p-2 border rounded-md w-full overflow-hidden whitespace-nowrap text-ellipsis">
                        const
                        charUrl=window.location.href,platform=window.location.hostname,sc...
                      </code>
                      <Button
                        onClick={() => {
                          navigator.clipboard.writeText(charPalExpScript);
                          toast.success("Script copied.");
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                    <div className="flex gap-2 mt-2 p-4 border rounded-xl flex-col">
                      <h1 className="text-lg text-center font-bold">
                        Script disclaimer and terms
                      </h1>
                      <p className="mb-4">
                        PalMirror does not automatically fetch characters from
                        third-party platforms. However, users may manually
                        obtain character data using external scripts.
                      </p>

                      <p className="mb-4">
                        By using any provided script or method to obtain
                        characters, you agree to the following:
                      </p>

                      <ul className="list-disc list-inside space-y-2">
                        <li>
                          <span className="font-semibold">
                            Personal Use Only
                          </span>{" "}
                          – The script is provided solely for{" "}
                          <span className="font-semibold">personal</span> use.
                          You may not use it for redistribution, commercial
                          purposes, or any activity that violates third-party
                          Terms of Service.
                        </li>
                        <li>
                          <span className="font-semibold">No Affiliation</span>{" "}
                          – PalMirror is{" "}
                          <span className="font-semibold">
                            not affiliated with
                          </span>
                          , endorsed by, or associated with any third-party
                          platform from which characters may be imported.
                        </li>
                        <li>
                          <span className="font-semibold">
                            User Responsibility
                          </span>{" "}
                          – PalMirror{" "}
                          <span className="font-semibold">
                            does not run or execute
                          </span>{" "}
                          any script on your behalf. The decision to use such
                          tools is entirely{" "}
                          <span className="font-semibold">yours</span>, and you
                          assume{" "}
                          <span className="font-semibold">
                            full responsibility
                          </span>{" "}
                          for any consequences.
                        </li>
                        <li>
                          <span className="font-semibold">No Liability</span> –
                          PalMirror and GoTeam Studios{" "}
                          <span className="font-semibold">
                            are not responsible
                          </span>{" "}
                          for any damages, loss of access, or penalties
                          resulting from the use of this script.
                        </li>
                        <li>
                          <span className="font-semibold">
                            Compliance with Laws
                          </span>{" "}
                          – You agree to comply with all applicable laws and
                          regulations regarding data usage and website
                          interactions.
                        </li>
                      </ul>

                      <p className="mt-4">
                        By proceeding, you acknowledge that you understand and
                        accept these terms. If you do not agree,{" "}
                        <span className="font-semibold">
                          do not use the script.
                        </span>
                      </p>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Step 2</h2>
                    <p>
                      Go to the character page you want to convert to a
                      PLExperience character.
                    </p>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Step 3</h2>
                    In the address bar, clear out the input and type in{" "}
                    <b className="font-bold p-2 rounded-sm border">
                      javascript:
                    </b>
                    , then paste the script.
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Step 4</h2>
                    Do <span className="font-bold text-red-500">not</span> press
                    Enter yet. Press the suggestion item that has a
                    world/internet icon, something like: <Earth />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Step 5</h2>
                    After a bit, the script should automatically create and
                    download a .plmc file.
                    <br />
                    <p className="text-sm opacity-50">
                      The script only supports only a few select platforms.
                    </p>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </DialogContent>
    </Dialog>
  );
}

function SetupCharacter({
  router,
  fileInputRef,
  characterData,
  handleInputChange,
  startChat,
  iconForm,
}: {
  router: ReturnType<typeof useRouter>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  characterData: CharacterData;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    field: keyof CharacterData
  ) => void;
  startChat: () => void;
  iconForm?: boolean;
}) {
  return (
    <Popover>
      <Dialog>
        <DialogTrigger asChild>
          {
            iconForm ? (<Button className="h-full p-5 py-1.5 rounded-full"><Plus className="w-8! h-8!" /></Button>) : (<Button className="mx-auto">Setup character</Button>)
          }
        </DialogTrigger>
        <DialogContent className="w-full max-w-[360px] xl:max-w-[960px] max-h-[80vh] overflow-y-auto font-sans">
          <AnimateChangeInHeight>
            <div className="px-1">
          <DialogHeader>
            <DialogTitle>Setup character</DialogTitle>
            <div className="palmirror-exc rounded-lg p-3 my-4! flex flex-col xl:flex-row justify-around items-center">
              <div className="flex justify-center items-center">
                <h1 className="text-2xl font-extrabold! tracking-tight text-center w-full palmirror-exc-text">
                  PalMirror Experience
                </h1>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <CircleHelp />
                  </Button>
                </PopoverTrigger>
              </div>
              <div className="flex justify-center items-center gap-2 xl:-order-1 mt-2! xl:mt-0!">
                <Button
                  variant="palmirror"
                  onClick={() => {
                    router.push("/experience/create");
                  }}
                >
                  Create
                </Button>
                <Button
                  variant="palmirror"
                  onClick={() => {
                    fileInputRef.current?.click();
                  }}
                >
                  Import from file
                </Button>
              </div>
            </div>
            <div className="flex flex-col xl:grid xl:grid-cols-3 xl:gap-4">
            <div className="py-4 xl:col-span-3">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="charName">
                  Character name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="charName"
                  value={characterData.name}
                  onChange={(e) => handleInputChange(e, "name")}
                />
              </div>
            </div>
            <div className="py-4">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="charPersonality">
                  Personality <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="charPersonality"
                  value={characterData.personality}
                  onChange={(e) => handleInputChange(e, "personality")}
                />
              </div>
            </div>
            <div className="py-4">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="charInitialMessage">
                  First message <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="charInitialMessage"
                  value={characterData.initialMessage}
                  onChange={(e) => handleInputChange(e, "initialMessage")}
                />
              </div>
            </div>
            <div className="py-4">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="charScenario">Scenario</Label>
                <Textarea
                  id="charScenario"
                  value={characterData.scenario}
                  onChange={(e) => handleInputChange(e, "scenario")}
                />
              </div>
            </div>
            </div>
            <div className="max-w-[360px] block mx-auto w-full">
                        <UserPersonalities></UserPersonalities>

            </div>
            { /* <Accordion type="single" collapsible className="w-full mb-4">
              <AccordionItem value="item-1">
                <AccordionTrigger>Your personality</AccordionTrigger>
                <AccordionContent>
                  <div className="py-4">
                    <div className="grid w-full items-center gap-1.5">
                      <Label htmlFor="userName">Your name</Label>
                      <Input
                        id="userName"
                        value={characterData.userName}
                        onChange={(e) => handleInputChange(e, "userName")}
                      />
                    </div>
                  </div>
                  <div className="py-4">
                    <div className="grid w-full items-center gap-1.5">
                      <Label htmlFor="userPersonality">Your personality</Label>
                      <Textarea
                        id="userPersonality"
                        value={characterData.userPersonality}
                        onChange={(e) =>
                          handleInputChange(e, "userPersonality")
                        }
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion> */ }
            <Button className="w-96 block mx-auto" onClick={startChat}>
              Start chat
            </Button>
          </DialogHeader>
          </div>
          </AnimateChangeInHeight>
        </DialogContent>
      </Dialog>
      <PopoverContent asChild>
        <div className="z-999999 min-w-80 font-sans">
          <p>
            <span className="palmirror-exc-text">PalMirror Experience</span> characters are characters made in PalMirror supercharged with features that go <b>way</b> beyond basic back-and-forth chatting. Explore your character&quot;s immersive nature, have memories, and a lot more.
          </p>
          <Button onClick={() => router.push("/experience/create")} variant="palmirror" className="w-full mt-4">Create a character</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function Home() {

  const PMNotify = usePMNotification();

  const [isSecureActivated, setIsSecureActivated] = useState(false);
  const [isSecureReady, setIsSecureReady] = useState(false);
  const [PLMSecurePass, setPLMSecurePass] = useState("");
  const PLMsecureContext = useContext(PLMSecureContext);
  const [passkeyOngoing, setPasskeyOngoing] = useState(false);
  const [PLMSecureLockUntil, setPLMSecureLockUntil] = useState(0);
  const [PLMSecureAttempts, setPLMSecureAttempts] = useState(0);

  const [tagline, setTagline] = useState("");

  const [chatList, setChatList] = useState<Array<ChatMetadata>>([]);
  const [chatsLoading, setChatsLoading] = useState(true);
  
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  

  const lockScreenControl = useAnimation();

  // const getRandomTagline = () => {
  //   return taglines[Math.floor(Math.random() * taglines.length)];
  // };
  // useEffect(() => {
  //   setTagline(getRandomTagline());
  // }, []);

  const loadCharacterData = () => {
    const storedData = localStorage.getItem("characterData");
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      const { image, plmex, ...rest } = parsedData;
      setCharacterData((prevData) => ({
        ...prevData,
        ...rest,
      }));
    }
  };

  const router = useRouter();
  const [characterData, setCharacterData] =
    useState<CharacterData>(defaultCharacterData);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [linkChar, setLinkChar] = useState("");

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    field: keyof CharacterData
  ) => {
    const value = event.target.value;
    setCharacterData({ ...characterData, [field]: value });
  };

  useEffect(() => {
    loadCharacterData();
  }, []);

  const getImageBase64 = async (url: string): Promise<string> => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const startChat = () => {
    if (
      !characterData.name ||
      !characterData.personality ||
      !characterData.initialMessage
    ) {
      PMNotify.error(
        "Please fill in all required fields (name, personality, first message)."
      );
      return;
    }

    setCharacterData((prevData) => {
      const updatedData = {
        ...prevData,
        image: "",
        plmex: defaultCharacterData.plmex,
      };
      localStorage.setItem("characterData", JSON.stringify(updatedData));
      PMNotify.success("Character data saved! Starting chat...");
      return updatedData;
    });
    sessionStorage.removeItem("chatSelect");
    router.push("/chat");
  };

  const getCharacterId: (url: string) => string | null = (
    url: string
  ): string | null => {
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

  const getChubaiInfo = (url: string = linkChar) => {
    toast.promise(
      new Promise<void>(async (resolve, reject) => {
        try {
          const authorName = getChubCharacterAuthor(url);
          const response = await fetch(
            `https://api.chub.ai/api/characters/${authorName}/${getChubCharacterId(
              url,
              authorName || ""
            )}?full=true`
          );
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();

          const { name, personality, initialMessage, plmex, ...rest } =
            characterData;

          const imageUrl = data.node.avatar_url;
          const imageBase64 = await getImageBase64(imageUrl);

          setCharacterData(() => {
            const updatedData: CharacterData = {
              ...rest,
              name: data.node.definition.name,
              personality:
                data.node.definition.personality ||
                data.node.definition.description,
              initialMessage: data.node.definition.first_message,
              alternateInitialMessages:
                (data.node.definition.alternate_greetings && [
                  data.node.definition.first_message,
                  ...data.node.definition.alternate_greetings,
                ]) ||
                [],
              scenario: data.node.definition.scenario,
              image: imageBase64,
              plmex: defaultCharacterData.plmex,
            };
            localStorage.setItem("characterData", JSON.stringify(updatedData));
            return updatedData;
          });

          sessionStorage.removeItem("chatSelect");
          router.push("/chat");
          resolve();
        } catch (error) {
          reject(
            new Error(`Failed to fetch character data from chub.ai: ${error}`)
          );
        }
      }),
      {
        pending: "Getting character...",
        success: "Character fetched from chub.ai!",
        error: "Failed to fetch character data from chub.ai.",
      }
    );
  };

  const importCharacter = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files![0];
    if (!file) {
      PMNotify.error("No file selected.");
      return;
    }

    const reader = new FileReader();

    toast.promise(
      new Promise<void>((resolve, reject) => {
        reader.onload = async function (event) {
          try {
            const fileContent = event.target?.result as ArrayBuffer;

            const text = new TextDecoder().decode(fileContent);
            const firstDelimiterIndex = text.indexOf("\n\n");
            const delimiterIndex = text.indexOf(
              "\n\n",
              firstDelimiterIndex + 1
            );
            if (delimiterIndex === -1) {
              reject(
                new Error(
                  "Invalid file format: unable to find the data delimiter."
                )
              );
              return;
            }

            const compressedData = fileContent.slice(delimiterIndex + 2);
            const compressedDataT = text.slice(delimiterIndex + 2);
            const decompressedData = file.name
              .split(".")
              .slice(0, -1)
              .join(".")
              .includes("ucm")
              ? compressedDataT
              : pako.ungzip(new Uint8Array(compressedData), { to: "string" });
            const characterData: CharacterData = JSON.parse(decompressedData);
            if (characterData.plmex.domain?.active && !isSecureReady) {
              PMNotify.info("Use PalMirror Secure for PalMirror Experience Domain characters!")
              reject(
                "Domain enabled character!"
              )
              return;
            }

            setCharacterData((oldCharacterData) => {
              const updatedData = { ...oldCharacterData, ...characterData };
              localStorage.setItem(
                "characterData",
                JSON.stringify(updatedData)
              );
              return updatedData;
            });

            if (characterData.plmex.domain?.active) {
              const chatKey = crypto.randomUUID()
              PLMsecureContext?.setSecureData(`METADATA${chatKey}`, {
                ...characterData,
                id: chatKey,
                lastUpdated: new Date().toISOString(),
              })
              sessionStorage.setItem("chatSelect", chatKey)
              router.push("/experience/domain")
              return;
            }
            sessionStorage.removeItem("chatSelect");
            router.push("/chat");

            resolve();
          } catch (err) {
            reject(
              new Error(
                "Failed to import the character. Please check the file format."
              )
            );
            console.error("Error while importing character:", err);
          }
        };

        reader.readAsArrayBuffer(file);
      }),
      {
        pending: "Processing character file...",
        success: "Character imported successfully.",
        error: "Failed to import the character.",
      }
    );
  };
  const PLMSecureAttemptUnlock = (key?: string) => {
    new Promise<void>(async (resolve, reject) => {
      if (Date.now() < PLMSecureLockUntil) {
        return;
      }
      const setKeySuccessful = await PLMsecureContext?.setKey(
        key ?? PLMSecurePass
      );
      setPLMSecurePass("");
      if (!setKeySuccessful) {
        reject();
        navigator.vibrate(150);
        lockScreenControl.set({ x: -20 });
        lockScreenControl.start({
          x: 0,
          transition: {
            type: "spring",
            mass: 0.6,
            stiffness: 1000,
            damping: 15,
          },
        });

        const newAttempts = PLMSecureAttempts + 1;
        setPLMSecureAttempts(newAttempts);
        if (newAttempts % 5 === 0) {
          const tier = Math.floor(newAttempts / 5);
          const lockUntil = Date.now() + 30 * 1000 * 2 ** (tier - 1);
          setPLMSecureLockUntil(lockUntil);

          localStorage.setItem("PLMSecureLockUntil", lockUntil.toString());
        }

        localStorage.setItem("PLMSecureAttempts", newAttempts.toString());
        return;
      }
      resolve();
      localStorage.removeItem("PLMSecureAttempts");
      localStorage.removeItem("PLMSecureLockUntil");
      if ("vibrate" in navigator) navigator.vibrate([50, 100, 50]);
      setIsSecureReady(true);
    });
  };

  

  

  useEffect(() => {
    isPalMirrorSecureActivated().then((activated) => {
      setIsSecureActivated(activated);
      console.log(isSecureActivated);
    });
  }, []);

  const authPasskey = async () => {
    if (
      PLMsecureContext?.hasCredential &&
      !PLMsecureContext?.isSecureReady() &&
      PLMSecureLockUntil < Date.now()
    ) {
      try {
        setPasskeyOngoing(true);
        console.log("PLM Secure - Attempting passkey authentication");
        const returnedKey = await PLMsecureContext?.authenticateCredential();
        const decoder = new TextDecoder("utf-8");
        PLMSecureAttemptUnlock(decoder.decode(returnedKey));
        setPasskeyOngoing(false);
      } catch (error) {
        console.error(error);
        PMNotify.error("Passkey dialog cancelled?");
        setPasskeyOngoing(false);
      }
    }
  };

  const throttledAuthPasskey = useDebounce((data) => {
    authPasskey();
  }, 500);

  useEffect(() => {
    throttledAuthPasskey(authPasskey);
  }, [PLMsecureContext?.hasCredential, PLMsecureContext?.isSecureReady]);

  useEffect(() => {
    if (PLMsecureContext) {
      setIsSecureReady(PLMsecureContext?.isSecureReady());
    }
  }, []);

  useEffect(() => {
    if (localStorage.getItem("PLMSecureLockUntil")) {
      setPLMSecureLockUntil(
        parseInt(localStorage.getItem("PLMSecureLockUntil") || "0")
      );
    }

    if (localStorage.getItem("PLMSecureAttempts")) {
      setPLMSecureAttempts(parseInt(localStorage.getItem("PLMSecureAttempts") || "0"));
    }
  }, []);

  useEffect(() => {
    const refreshChatList = async () => {
      if (isSecureReady) {
        let chatStore;
        try {
          chatStore = await PLMsecureContext?.getAllKeys();
        } catch {
          return;
        }
        if (chatStore) {
          const filteredChats = chatStore.filter((key: string) =>
            key.startsWith("METADATA")
          );
          const chatListPromises = filteredChats.map(async (key: string) => {
            const chatData = await PLMsecureContext?.getSecureData(key);
            return chatData;
          });
          Promise.all(chatListPromises).then((resolvedChatList) => {
            if (chatListPromises.length < 3) {
              setChatList(resolvedChatList);
              setChatsLoading(false);
              return;
            }
            setTimeout(() => {
              setChatsLoading(false);
              setChatList(resolvedChatList);
            }, 0);
          });
        }
      }
    };

    refreshChatList();
  }, [isSecureReady]);

  const handleKeyPressPin = (key: string) => {
    const secureMetadata = localStorage.getItem("secureMetadata");
    const secureLength = secureMetadata ? JSON.parse(secureMetadata).length : 0;

    if (key === "⌫") {
      setPLMSecurePass((prev) => prev.slice(0, -1));
    } else if (PLMSecurePass.length < secureLength) {
      setPLMSecurePass((prev) => prev + key);
    } else {
      //      PLMSecureAttemptUnlock();
    }
  };

  useEffect(() => {
    const secureMetadata = localStorage.getItem("secureMetadata");
    const secureLength = secureMetadata ? JSON.parse(secureMetadata).length : 0;
    if (
      localStorage.getItem("secureMetadata") &&
      PLMSecurePass.length === secureLength
    ) {
      setTimeout(PLMSecureAttemptUnlock, 200);
    }
  }, [PLMSecurePass]);

  const [, rerenderho] = useState(0);
  useEffect(() => {
    const i = setInterval(() => {
      if (Date.now() < PLMSecureLockUntil || true) {
        /* sue me */
        rerenderho(Math.random());
      }
    }, 100);

    return () => clearInterval(i);
  });



  return isSecureActivated ? (
    <div className="flex flex-col items-center justify-items-center min-h-screen p-4  gap-4 sm:p-8 font-(family-name:--font-geist-sans)">
      <div className="z-100 fixed flex justify-center lg:justify-start w-screen mix-blend-color-dodge">
        <motion.h1
          initial={{ scale: 1, y: -100 }}
          animate={{ scale: 1, y: 0 }}
          transition={{
            type: "spring",
            mass: 1,
            damping: 23,
            stiffness: 161,
            scale: { type: "spring", mass: 1, damping: 18, stiffness: 100 },
          }}
          className="text-1xl lg:text-2xl mx-6 lg:mx-10 font-extrabold tracking-tight pb-2 w-fit opacity-100 text-[#aaaaaa]"
        >
          PalMirror
        </motion.h1>
      </div>

      <div className="flex grow w-full">
        <AnimatePresence mode="popLayout">
          {!isSecureReady && (
            <motion.div
              className="overflow-hidden w-screen h-[80vh] relative"
              initial={{ x: 0 }}
              animate={lockScreenControl}
            >
              {Date.now() < PLMSecureLockUntil ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, x: "-50%", y: "-50" }}
                  animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
                  transition={{ type: "spring", stiffness: 100, damping: 20 }}
                  className="absolute top-1/2 left-1/2 transform w-full text-center"
                >
                  <h1 className="font-bold mb-2 text-lg">
                    Too many incorrect attempts
                  </h1>
                  <NumberFlowGroup>
                    {(PLMSecureLockUntil - Date.now()) / 1000 >= 60 ? (
                      <NumberFlow
                        prefix={"Try again in "}
                        suffix={" minutes and "}
                        value={Math.floor(
                          (PLMSecureLockUntil - Date.now()) / 1000 / 60
                        )}
                      ></NumberFlow>
                    ) : null}
                    <NumberFlow
                      prefix={
                        (PLMSecureLockUntil - Date.now()) / 1000 < 60
                          ? "Try again in "
                          : ""
                      }
                      suffix={" seconds."}
                      value={
                        Math.floor((PLMSecureLockUntil - Date.now()) / 1000) %
                        60
                      }
                    ></NumberFlow>
                  </NumberFlowGroup>
                  <p className="opacity-25 italic mt-6">take a chill pill!</p>
                </motion.div>
              ) : null}
              <motion.div
                initial={{ opacity: 0, scale: 1, x: "-50%", y: '-10%' }}
                animate={{
                  opacity: Date.now() < PLMSecureLockUntil ? 0.2 : 1,
                  y: "-50%",
                  scale: passkeyOngoing ? 0.9 : 1,
                  filter:
                    passkeyOngoing || Date.now() < PLMSecureLockUntil
                      ? "blur(5px)"
                      : "blur(0px)",
                }}
                exit={{ scale: 0.9, opacity: 0, filter: PLMGlobalConfigServiceInstance.get("highend") ? 'blur(5px)' : '' }}
                transition={{
                  type: "spring",
                  mass: 1,
                  damping: 39,
                  stiffness: 400,
                }}
                className={`flex items-center justify-center gap-2 flex-col grow absolute top-1/2 left-1/2 w-full ${
                  Date.now() < PLMSecureLockUntil ? "pointer-events-none" : null
                }`}
                key="passkeyNeed"
              >
                <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight pb-2 text-center">
                  {tagline}
                </h1>
                <p>Enter Passcode</p>
                {/* <Button onClick={authPasskey}>Use passkey</Button> */}
                {/* <hr className="m-2! w-full max-w-(--breakpoint-sm) h-px" /> */}
                <div className="flex gap-2 w-full max-w-(--breakpoint-sm)">
                  {localStorage.getItem("secureMetadata") ? (
                    <div className="w-full">
                      <PinDisplay input={PLMSecurePass} show={false} many={JSON.parse(localStorage.getItem("secureMetadata") || "[]").length} />
                      <Keypad onKeyPress={handleKeyPressPin} fromBottom={true} />
                    </div>
                  ) : (
                    <div className="flex gap-2 w-full max-w-(--breakpoint-sm)">
                      <Input
                        value={PLMSecurePass}
                        onChange={(e) => setPLMSecurePass(e.target.value)}
                        onKeyDown={(
                          e: React.KeyboardEvent<HTMLInputElement> | null
                        ) => {
                          if (e && e.key === "Enter") {
                            PLMSecureAttemptUnlock();
                          }
                        }}
                        type="password"
                        className="grow"
                      />
                      <Button onClick={() => PLMSecureAttemptUnlock()}>
                        Unlock
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
          {/* chats list */}
          {isSecureReady && (
            <motion.div
              initial={{ opacity: 0, scale: 1 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                type: "spring",
                mass: 1,
                damping: 19,
                stiffness: 161,
              }}
              className="w-full"
              key="chatList"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 grow w-full justify-center items-start ">
                <AnimatePresence mode="popLayout">
                  {chatList.length > 0 ?
                  sortByLastUpdated(chatList).filter((chat) => { 
                    if (chat.associatedDomain) {
                      return false;
                    }
                    return true
                  }).map((chat, i) => (
                    <ChatCard
                      key={chat.id}
                      chat={chat}
                      index={i}
                      PLMsecureContext={PLMsecureContext}
                      setChatList={setChatList}
                      router={router}
                    />
                  ))
                  : (
                    <p className="opacity-50 text-sm">
                      {chatsLoading
                        ? "Loading your chats..."
                        : "No chats found."}
                    </p>
                  )}
                
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {isSecureReady && (
        <motion.div
          initial={{ opacity: 0, y: 200 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            mass: 1,
            damping: 19,
            stiffness: 161,
            delay: 0.1,
          }}
          className="fixed bottom-0 pb-7"
        >
          <div className="flex items-center content-center justify-center gap-2 max-w-fit border border-white/10 p-2 rounded-full">
            <Tooltip delayDuration={100}>
              <TooltipTrigger>
                  <GetFromPlatform
                    router={router}
                    linkChar={linkChar}
                    setLinkChar={setLinkChar}
                    getChubaiInfo={getChubaiInfo}
                    iconForm
                  />
              </TooltipTrigger>
              <TooltipContent className="font-sans">
                Get from a platform
              </TooltipContent>
            </Tooltip>
            <Tooltip delayDuration={100}>
              <TooltipTrigger>
                <SetupCharacter
                  router={router}
                  fileInputRef={fileInputRef}
                  characterData={characterData}
                  handleInputChange={handleInputChange}
                  startChat={startChat}
                  iconForm
                />
              </TooltipTrigger>
              <TooltipContent className="font-sans">
                Setup character
              </TooltipContent>
            </Tooltip>
            <Tooltip delayDuration={100}>
              <TooltipTrigger>
                <Button onClick={() => router.push("/settings")} className="rounded-full" size="icon" variant="ghost">
                  <Settings className="w-6! h-6!" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="font-sans">
                Settings
              </TooltipContent>
            </Tooltip>
          </div>
        </motion.div>
      )}

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
      <input
        ref={fileInputRef}
        type="file"
        accept=".plmc"
        style={{ display: "none" }}
        onChange={importCharacter}
      />
    </div>
  ) : (
    <div className="grid items-center justify-items-center content-center min-h-screen p-8 pb-10 gap-4 sm:p-20 font-(family-name:--font-geist-sans)">
      <h1 className="scroll-m-20 text-1xl font-extrabold tracking-tight">
        PalMirror
      </h1>
      <h1 className="text-3xl font-extrabold tracking-tight lg:text-5xl pb-2 text-start flex flex-col sm:flex-row items-center -gap-1 sm:gap-4">
        <span className="opacity-25">Your World.<br /></span>
        Your Reflection.
      </h1>

      <div className="pb-7">
        <Button onClick={() => setOnboardingOpen(true)}>
          {`Start Onboarding`}
        </Button>
        {/* <Accordion type="single" collapsible className="w-fit mt-4">
          <AccordionItem value="item-1">
            <AccordionTrigger></AccordionTrigger>
            <AccordionContent>
              <div className="flex justify-items-center items-center gap-1 flex-row">
                <GetFromPlatform
                  router={router}
                  linkChar={linkChar}
                  setLinkChar={setLinkChar}
                  getChubaiInfo={getChubaiInfo}
                />
                        <Button
          className=""
          onClick={() => router.push("/search")}
        >
          Search for a character
        </Button>
        
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion> */}
      </div>
      {/* <p className="text-sm opacity-40 text-center">PalMirror does NOT claim ownership of any given character.</p> */}
      <div className="flex gap-4 absolute bottom-0 left-0 p-6 items-center justify-between w-full">
        <a className="opacity-20 hover:opacity-80 transition-opacity" href="https://discord.gg/DhaszrVYZ7" target="_blank" rel="noopener noreferrer">
          <img src={"./discord.svg"} alt="Discord Logo" className="w-8 h-8" />
        </a>
        <p className="text-sm opacity-10 max-w-[70vw] text-end">
          An opinionated, immersive, {" "}
          <u>
            <a href="https://github.com/Joystickplays/palmirror">open-source</a>
          </u>{" "}
          AI chat client project
        </p>
      </div>


      <Dialog open={onboardingOpen} onOpenChange={setOnboardingOpen}>
        <DialogContent onOpenAutoFocus={(e) => e.preventDefault()} className="max-w-[90vw]! h-[90vh] p-12 font-sans flex flex-col gap-2">
          <h1 className="text-2xl font-extrabold">PalMirror <span className="opacity-50">Onboarding</span> </h1>
          <p className="text-sm opacity-50">PalMirror is an AI chat client that has both privacy, functions and sleek interfaces.<br />It is made to be really easy to setup:</p>
          <div className="flex flex-col md:flex-row justify-center items-center w-full h-full flex-1">
            <div className="w-full md:h-full flex-1  flex flex-col gap-2 items-center p-4 md:p-12">
              <h2 className="text-xl md:text-2xl font-bold">Try out chatting</h2>
              <p className="opacity-50 text-center">Get a quick feel on how PalMirror works for you.</p>
              <div className="flex flex-col md:flex-row justify-center items-center h-full w-full gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <SetupCharacter
                        router={router}
                        fileInputRef={fileInputRef}
                        characterData={characterData}
                        handleInputChange={handleInputChange}
                        startChat={startChat}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="font-sans">
                    Quickly create a character from scratch to chat
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <GetFromPlatform
                  router={router}
                  linkChar={linkChar}
                  setLinkChar={setLinkChar}
                  getChubaiInfo={getChubaiInfo}
                />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="font-sans">
                    Get a character from platforms like chub.ai and JannyAI
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
            <div className="relative w-full h-10 md:w-10 md:h-full flex items-center justify-center">
              <div className="w-full h-px md:w-px md:h-full bg-white/50"></div>
              <p className="absolute bg-background p-1 whitespace-nowrap">Want more?</p>
            </div>
            <div className="w-full md:h-full flex-1  flex flex-col gap-2 items-center p-4 md:p-12">
              <h2 className="text-xl md:text-2xl font-bold">Get the full experience</h2>
              <p className="opacity-50 text-center">Enable encrypted chat saving and more features.</p>
              <div className="flex flex-row justify-center items-center h-full w-full gap-2">
                <Button onClick={() => router.push("/secure")}>Setup PalMirror Secure</Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
      <input
        ref={fileInputRef}
        type="file"
        accept=".plmc"
        style={{ display: "none" }}
        onChange={importCharacter}
      />
    </div>
  );
}
