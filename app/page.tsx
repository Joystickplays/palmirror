"use client";

import { useState, useEffect, useRef, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToastContainer, toast } from "react-toastify";
import { CircleHelp, ArrowRight, Trash2, Earth } from "lucide-react";
import "react-toastify/dist/ReactToastify.css";

import Keypad from "@/components/Keypad";
import PinDisplay from "@/components/PINDisplay";

import { AnimatePresence, motion } from "motion/react";

import pako from "pako";

import { CharacterData, defaultCharacterData } from "@/types/CharacterData";
interface ChatMetadata extends CharacterData {
  id: string;
  lastUpdated: Date;
}

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

import { useRouter } from "next/navigation";

// New components moved outside Home():
function GetFromPlatform({
  router,
  linkChar,
  setLinkChar,
  getChubaiInfo,
}: {
  router: ReturnType<typeof useRouter>;
  linkChar: string;
  setLinkChar: React.Dispatch<React.SetStateAction<string>>;
  getChubaiInfo: () => void;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Get from a platform</Button>
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
}: {
  router: ReturnType<typeof useRouter>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  characterData: CharacterData;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    field: keyof CharacterData,
  ) => void;
  startChat: () => void;
}) {
  return (
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
                <h1 className="text-2xl !font-extrabold tracking-tight text-center w-full palmirror-exc-text">
                  PalMirror Experience
                </h1>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <CircleHelp />
                  </Button>
                </PopoverTrigger>
              </div>
              <div className="flex justify-center items-center gap-2 !mt-2">
                <Button
                  variant="palmirror"
                  onClick={() => {
                    router.push("/palexp/create");
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
            <div className="py-4">
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
                <Input
                  id="charScenario"
                  value={characterData.scenario}
                  onChange={(e) => handleInputChange(e, "scenario")}
                />
              </div>
            </div>
            <Accordion type="single" collapsible className="w-full mb-4">
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
            </Accordion>
            <Button className="w-80" onClick={startChat}>
              Start chat
            </Button>
          </DialogHeader>
        </DialogContent>
      </Dialog>
      <PopoverContent asChild className="z-[999999] min-w-80">
        <p>
          PalMirror-exclusive characters with customizable traits and reactions.
          Adjust their emotions and status in real-time as they react to your
          changes, triggering sounds and effects. More features are being worked
          out for PalMirror Experience characters.
        </p>
      </PopoverContent>
    </Popover>
  );
}

export default function Home() {
  const [isSecureActivated, setIsSecureActivated] = useState(false);
  const [isSecureReady, setIsSecureReady] = useState(false);
  const [PLMSecurePass, setPLMSecurePass] = useState("");
  const PLMsecureContext = useContext(PLMSecureContext);
  const [tagline, setTagline] = useState("");

  const [chatList, setChatList] = useState<Array<ChatMetadata>>([]);

  const taglines = [
    "password plz",
    "What's the password? (It's not 1234.. hopefully.)",
    "Locked up tighter than a snack stash.",
    "We just need your key to your.. private space.",
    "Go on, unlock it.",
    "Have the password? Cool.",
    "You know the drill. Password.",
    "Nothing to see here.. promise.",
    "Password, or go home.",
    "Unless you know the password, LEAVE.",
    "Access denied... unless?",
    "Your secret phrase, please.",
    "Psst, what's the magic word?",
    "Knock knock. Who's there? Password.",
    "Got the code? Prove it.",
    "You didn't forget it, did you?",
    "Passwords: Keeping nosy people out since forever.",
    "The door's locked. You have the key?",
    "Halt! Who goes there? Password required.",
    "No password? No entry.",
    "Think you can guess? Think again.",
    "This isn't a guessing game, or is it?",
    "Enter the magic word to continue.",
    "It's password time, don't mess it up.",
    "Nope, still waiting for that password.",
    "Hey, sharing passwords is a no-no.",
    "Forgot your password? Awkward.",
    "This is the part where you type the password.",
    "Passwords: Small but mighty.",
    "Shh... it's a secret.",
    "One does not simply enter without the password.",
    "No password? No fun.",
    "Hint: It's not 'password'.",
    "Your ticket in? The password.",
    "The secret handshake won't work here.",
    "Access is one password away.",
    "Don't worry, we're not judging your password strength. (Much.)",
    "Guessing won't get you far.",
    "Is it your pet's name? Be honest.",
    "One tiny word stands between you and glory.",
    "You bring the password, we'll bring the access.",
    "Your move. Password time.",
    "No password? No dice.",
    "Spoiler alert: You need the password.",
    "Type it carefully… no pressure.",
    "The gates are locked. What's the code?",
    "Security is fun, isn't it?",
    "Trust us, it's worth it. Enter the password.",
    "Not taking user data as bribery.",
    "Just hoping that the password manager doesn't autofill the input...",
  ];

  const getRandomTagline = () => {
    return taglines[Math.floor(Math.random() * taglines.length)];
  };
  useEffect(() => {
    setTagline(getRandomTagline());
  }, []);

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
    field: keyof CharacterData,
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
      toast.error(
        "Please fill in all required fields (name, personality, first message).",
      );
      return;
    }

    setCharacterData((prevData) => {
      const updatedData = {
        ...prevData,
        image: "",
        plmex: { dynamicStatuses: [], invocations: [] },
      };
      localStorage.setItem("characterData", JSON.stringify(updatedData));
      toast.success("Character data saved! Starting chat...");
      return updatedData;
    });
    sessionStorage.removeItem("chatSelect");
    router.push("/chat");
  };

  const getCharacterId: (url: string) => string | null = (
    url: string,
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
            `https://api.chub.ai/api/characters/${authorName}/${getChubCharacterId(url, authorName || "")}?full=true`,
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
              plmex: {
                dynamicStatuses: [],
                invocations: [],
              },
            };
            localStorage.setItem("characterData", JSON.stringify(updatedData));
            return updatedData;
          });

          sessionStorage.removeItem("chatSelect");
          router.push("/chat");
          resolve();
        } catch (error) {
          reject(
            new Error(`Failed to fetch character data from chub.ai: ${error}`),
          );
        }
      }),
      {
        pending: "Getting character...",
        success: "Character fetched from chub.ai!",
        error: "Failed to fetch character data from chub.ai.",
      },
    );
  };

  const importCharacter = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files![0];
    if (!file) {
      toast.error("No file selected.");
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
              firstDelimiterIndex + 1,
            );
            if (delimiterIndex === -1) {
              reject(
                new Error(
                  "Invalid file format: unable to find the data delimiter.",
                ),
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

            setCharacterData((oldCharacterData) => {
              const updatedData = { ...oldCharacterData, ...characterData };
              localStorage.setItem(
                "characterData",
                JSON.stringify(updatedData),
              );
              return updatedData;
            });

            sessionStorage.removeItem("chatSelect");
            router.push("/chat");

            resolve();
          } catch (err) {
            reject(
              new Error(
                "Failed to import the character. Please check the file format.",
              ),
            );
            console.error("Error while importing character:", err);
          }
        };

        reader.readAsArrayBuffer(file);
      }),
      {
        pending: "Processing character file...",
        success: "Character imported successfully.",
        error: "Failed to import the character. Please check the file format.",
      },
    );
  };

  const PLMSecureAttemptUnlock = () => {
    toast.promise(
      new Promise<void>(async (resolve, reject) => {
        const setKeySuccessful = await PLMsecureContext?.setKey(PLMSecurePass);
        setPLMSecurePass("");
        if (!setKeySuccessful) {
          reject();
          return;
        }
        resolve();
        setIsSecureReady(true);
      }),
      {
        pending: "Verifying...",
        success: "Unlocked successfully. Welcome back!",
        error: "Failed to unlock.",
      },
    );
  };

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

  /* eslint-disable @typescript-eslint/no-explicit-any */
  function sortByLastUpdated(
    data: { [key: string]: any }[],
  ): { [key: string]: any }[] {
    return data.sort(
      (a, b) =>
        new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime(),
    );
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */

  useEffect(() => {
    isPalMirrorSecureActivated().then((activated) => {
      setIsSecureActivated(activated);
      console.log(isSecureActivated);
    });
  }, []);

  useEffect(() => {
    if (PLMsecureContext) {
      setIsSecureReady(PLMsecureContext.isSecureReady());
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
            key.startsWith("METADATA"),
          );
          const chatListPromises = filteredChats.map(async (key: string) => {
            const chatData = await PLMsecureContext?.getSecureData(key);
            return chatData;
          });
          const resolvedChatList = await Promise.all(chatListPromises);
          setChatList(resolvedChatList);
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
    if (localStorage.getItem("secureMetadata") && PLMSecurePass.length === secureLength) {    
      setTimeout(PLMSecureAttemptUnlock, 200);
    }
  }, [PLMSecurePass])

  return isSecureActivated ? (
    <div className="flex flex-col items-center justify-items-center min-h-screen p-4  gap-4 sm:p-8 font-[family-name:var(--font-geist-sans)]">
      <div className="w-full">
        <motion.h1
          initial={{ scale: 0, x: -200 }}
          animate={{ scale: 1, x: 0 }}
          transition={{
            type: "spring",
            mass: 1,
            damping: 23,
            stiffness: 161,
            scale: { type: "spring", mass: 1, damping: 18, stiffness: 100 },
          }}
          className="scroll-m-20 text-1xl font-extrabold tracking-tight lg:text-3xl pb-2 w-full"
        >
          PalMirror
        </motion.h1>
      </div>

      <div className="flex flex-grow w-full">
        <AnimatePresence mode="popLayout">
          {!isSecureReady && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{
                type: "spring",
                mass: 1,
                damping: 19,
                stiffness: 161,
              }}
              className="flex items-center justify-center gap-2 flex-col flex-grow"
            >
              <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight pb-2 text-center">
                {tagline}
              </h1>
              <p>PalMirror Secure is active and encrypted.</p>
              <hr className="!m-2 w-full max-w-screen-sm h-px" />
              <div className="flex gap-2 w-full max-w-screen-sm">
                {localStorage.getItem("secureMetadata") ? (
                  <div className="w-full">
                    <PinDisplay input={PLMSecurePass} show={false} />
                    <Keypad onKeyPress={handleKeyPressPin}/>
                  </div>
                ) : (
                  <div className="flex gap-2 w-full max-w-screen-sm">
                    <Input
                      value={PLMSecurePass}
                      onChange={(e) => setPLMSecurePass(e.target.value)}
                      onKeyDown={(
                        e: React.KeyboardEvent<HTMLInputElement> | null,
                      ) => {
                        if (e && e.key === "Enter") {
                          PLMSecureAttemptUnlock();
                        }
                      }}
                      type="password"
                      className="flex-grow"
                    />
                    <Button onClick={PLMSecureAttemptUnlock}>Unlock</Button>
                  </div>
                )}
              </div>
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
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 flex-grow w-full justify-center items-start ">
                <AnimatePresence mode="popLayout">
                  {chatList.length > 0 ? (
                    sortByLastUpdated(chatList).map((chat, index) => (
                      <motion.div
                        initial={{
                          opacity: 0,
                          scale: 0.7,
                          y: 100,
                          filter: "blur(10px)",
                        }}
                        animate={{
                          opacity: 1,
                          scale: 1,
                          y: 0,
                          filter: "blur(0px)",
                        }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        transition={{
                          delay: index * 0.05,
                          type: "spring",
                          mass: 1,
                          damping: 27,
                          stiffness: 161,
                          restDelta: 0.001,
                          y: {
                            type: "spring",
                            mass: 1,
                            damping: 13,
                            stiffness: 97,
                          },
                        }}
                        key={chat.lastUpdated}
                        className="flex flex-col gap-1.5 p-6 border rounded-xl h-full"
                      >
                        {chat.image && (
                          <div>
                          <img
                            src={chat.image}
                            className="absolute inset-0 top-0 left-0 right-0 bottom-0 w-[200px] h-full rounded-xl object-cover object-[50%_30%] pointer-events-none"
                            style={{ maskImage: 'linear-gradient(to right, rgba(0, 0, 0, 1), transparent)' }}
                          />
                          </div>
                        )}
                        <h2 className="font-bold ml-auto">{chat.name}</h2>
                        <p className="opacity-70 ml-auto text-xs">
                          {formatDateWithLocale(chat.lastUpdated)}
                        </p>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              PLMsecureContext?.removeKey(chat.id);
                              PLMsecureContext?.removeKey(`METADATA${chat.id}`);
                              setChatList((prevList) =>
                                prevList.filter(
                                  (chatItem) => chatItem.id !== chat.id,
                                ),
                              );
                            }}
                          >
                            <Trash2 />
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              sessionStorage.setItem("chatSelect", chat.id);
                              router.push(`/chat`);
                            }}
                          >
                            Continue <ArrowRight />
                          </Button>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <p className="opacity-50 text-sm">No chats found.</p>
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
          transition={{ type: "spring", mass: 1, damping: 19, stiffness: 161 }}
          className="fixed bottom-0 translate-x-1/2 pb-7"
        >
          <div className="flex items-center content-center justify-center gap-2 sm:gap-4 max-w-fit">
            <GetFromPlatform
              router={router}
              linkChar={linkChar}
              setLinkChar={setLinkChar}
              getChubaiInfo={getChubaiInfo}
            />
            <SetupCharacter
              router={router}
              fileInputRef={fileInputRef}
              characterData={characterData}
              handleInputChange={handleInputChange}
              startChat={startChat}
            />
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
    <div className="grid items-center justify-items-center content-center min-h-screen p-8 pb-20 gap-4 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <h1 className="scroll-m-20 text-1xl font-extrabold tracking-tight lg:text-3xl pb-2">
        PalMirror
      </h1>
      <h1 className="text-3xl font-extrabold tracking-tight lg:text-5xl pb-2 text-center w-full">
        Mirrors your favourite characters.
      </h1>

      <div className="pb-7 w-full">
        <Button
          className="block mx-auto"
          onClick={() => router.push("/search")}
        >
          Search for a character
        </Button>
        <Accordion type="single" collapsible className="w-full mt-4">
          <AccordionItem value="item-1">
            <AccordionTrigger></AccordionTrigger>
            <AccordionContent>
              <div className="flex justify-items-center items-center gap-1 flex-col sm:flex-row sm:gap-4">
                <GetFromPlatform
                  router={router}
                  linkChar={linkChar}
                  setLinkChar={setLinkChar}
                  getChubaiInfo={getChubaiInfo}
                />
                <SetupCharacter
                  router={router}
                  fileInputRef={fileInputRef}
                  characterData={characterData}
                  handleInputChange={handleInputChange}
                  startChat={startChat}
                />
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
      {/* <p className="text-sm opacity-40 text-center">PalMirror does NOT claim ownership of any given character.</p> */}
      <p className="text-sm opacity-40 text-center">
        An{" "}
        <u>
          <a href="https://github.com/Joystickplays/palmirror">open-source</a>
        </u>{" "}
        project by GoTeam
      </p>

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
