"use client";

import { useState, useEffect, useRef, useContext } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToastContainer, toast } from "react-toastify";
import { Check } from "lucide-react";
import Keypad from "@/components/Keypad";
import PinDisplay from "@/components/PINDisplay";
import "react-toastify/dist/ReactToastify.css";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

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

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  setSecureData,
  removeSecureData,
  isPalMirrorSecureActivated,
} from "@/utils/palMirrorSecureUtils";

import { useRouter } from "next/navigation";

import { motion, AnimatePresence } from "framer-motion";
import { AnimateChangeInHeight } from "@/components/AnimateHeight";

import { PLMSecureContext } from "@/context/PLMSecureContext";

export default function Home() {
  const router = useRouter();
  const PLMsecureContext = useContext(PLMSecureContext);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);

  const [selectedMethod, setSelectedMethod] = useState("password");

  const [alreadyEncrypted, setAlreadyEncrypted] = useState(false);
  const [showCompleteDrawer, setShowCompleteDrawer] = useState(false);
  const [showPasskeySetupDrawer, setShowPasskeySetupDrawer] = useState(false);
  const [passkeyVerification, setPasskeyVerification] = useState("");

  const handleKeyPressPin = (key: string) => {
    if (key === "⌫") {
      setPin((prev) => prev.slice(0, -1));
    } else if (pin.length < 12) {
      setPin((prev) => prev + key);
    }
  };

  const setupPLMSecure = async () => {
    if (selectedMethod === "password" && password.length < 6) {
      toast.error("Password too short!");
      return;
    }
    if (selectedMethod === "pin" && pin.length < 6) {
      toast.error("PIN too short! Atleast 6 digits.");
      return;
    }
    if (selectedMethod === "password" && password !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    try {
      await setSecureData(
        "generalSettings",
        {
          proxy: {
            api_key: "",
          },
        },
        selectedMethod === "password" ? password : pin,
      );
      if (selectedMethod === "pin") {
        localStorage.setItem(
          "secureMetadata",
          JSON.stringify({ type: selectedMethod, length: pin.length }),
        );
      }
      //toast.success("Setup successful!");
      setAlreadyEncrypted(true);
      setShowCompleteDrawer(true);
    } catch (error) {
      toast.error("Failed to setup PalMirror Secure...");
      console.log(error);
    }
    setPassword("");
    setConfirmPassword("");
    setPin("");
  };

  const removePLMSecure = async () => {
    await indexedDB.deleteDatabase("PalMirrorSecure");
    localStorage.removeItem("secureMetadata");
    setAlreadyEncrypted(false);
    toast.success("PalMirror Secure removed successfully!");
  };

  const verifyAndCreatePasskey = async () => {
    if (!(await PLMsecureContext?.verifyKey(passkeyVerification))) {
      toast.error("Password is incorrect.");
      return;
    }
    try {
      await PLMsecureContext?.registerCredential(passkeyVerification);
      setShowPasskeySetupDrawer(false);
      setPasskeyVerification("");
      toast.success(
        "Passkey setup successful! Try by going to your chat list.",
      );
    } catch (error) {
      toast.error("Failed to setup! Canceled the dialog?");
    }
  };

  useEffect(() => {
    const checkEncryptionStatus = async () => {
      try {
        const activated = await isPalMirrorSecureActivated();
        setAlreadyEncrypted(activated);
      } catch (error) {
        console.error("Failed to check encryption status:", error);
      }
    };

    checkEncryptionStatus();
    console.log(alreadyEncrypted);
  }, []);

  return (
    <div className="grid items-center justify-items-center content-center min-h-screen p-8 pb-20 gap-4 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <h1 className="scroll-m-20 text-1xl font-extrabold tracking-tight pb-2">
        PalMirror Secure
      </h1>
      <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight lg:text-5xl pb-2 text-center w-4/5">
        Your chats is yours, and yours only.
      </h1>
      {!alreadyEncrypted && (
        <Dialog>
          <DialogTrigger asChild>
            <Button>Setup PalMirror Secure</Button>
          </DialogTrigger>
          <DialogContent className="font-sans">
          <AnimateChangeInHeight>
            <DialogHeader>
              <DialogTitle className="mb-4">Setup PalMirror Secure</DialogTitle>
            </DialogHeader>
            <Tabs
              defaultValue="password"
              className="block mx-auto w-full"
              value={selectedMethod}
              onValueChange={setSelectedMethod}
            >
              <TabsList className="w-full mb-2">
                <TabsTrigger className="w-full" value="password">
                  Password
                </TabsTrigger>
                <TabsTrigger className="w-full" value="pin">
                  PIN
                </TabsTrigger>
              </TabsList>
              <TabsContent value="password" asChild>
                <motion.div
                  key="password"
                  className="flex flex-col gap-4"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    type: "spring",
                    mass: 1,
                    stiffness: 250,
                    damping: 22,
                  }}
                >
                  <Label htmlFor="password">Password</Label>
                  <Input
                    type="password"
                    id="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    type="password"
                    id="confirmPassword"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <DialogClose asChild>
                    <Button onClick={setupPLMSecure}>Encrypt</Button>
                  </DialogClose>
                  <p className="text-sm opacity-70 text-red-500 text-center">
                    PalMirror Secure is NOT recoverable! If you forget the
                    password, your chats will need to be wiped.
                  </p>
                </motion.div>
              </TabsContent>
              <TabsContent value="pin" asChild>
                <motion.div
                  key="pin"
                  className="flex flex-col gap-4"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    type: "spring",
                    mass: 1,
                    stiffness: 250,
                    damping: 22,
                  }}
                >
                  <PinDisplay input={pin} show={showPin} />
                  <Keypad onKeyPress={handleKeyPressPin} />
                  <div className="flex gap-2 justify-end">
                    <DialogClose asChild>
                      <Button className="w-full" onClick={setupPLMSecure}>
                        Encrypt
                      </Button>
                    </DialogClose>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowPin(!showPin);
                      }}
                    >
                      {showPin ? "Hide" : "Show"} PIN
                    </Button>
                  </div>

                  <p className="text-sm opacity-70 text-red-500 text-center">
                    PINs are easier to crack than passwords. Use a long, secure
                    PIN and avoid common patterns like &apos;0000&apos;,
                    &apos;1234&apos;, or your birthday.
                  </p>
                  <p className="text-sm opacity-70 text-red-500 text-center">
                    PalMirror Secure is NOT recoverable! If you forget the
                    password, your chats will need to be wiped.
                  </p>
                </motion.div>
              </TabsContent>
            </Tabs>
            </AnimateChangeInHeight>
          </DialogContent>
        </Dialog>
      )}
      {alreadyEncrypted && (
        <div className="flex flex-col gap-2">
          <p className="text-sm">
            Woo! You&apos;re already using PalMirror Secure.
          </p>
          <Dialog>
            <DialogTrigger asChild>
              <Button>Remove PalMirror Secure</Button>
            </DialogTrigger>
            <DialogContent className="font-sans">
              <DialogHeader>
                <DialogTitle>Remove PalMirror Secure</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                <p>By removing PalMirror Secure, lost data will include:</p>
                <ul className="list-disc pl-5">
                  <li>Encrypted chats</li>
                  <li>API Key configuration</li>
                </ul>
                <p>
                  Are you sure you want to remove PalMirror Secure? This action
                  cannot be undone.{" "}
                </p>
                <DialogClose asChild>
                  <Button variant="destructive" onClick={removePLMSecure}>
                    Confirm Removal
                  </Button>
                </DialogClose>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <Accordion
        type="single"
        collapsible
        className="w-full mb-4 mx-4 lg:mx-20"
      >
        <AccordionItem value="item-1">
          <AccordionTrigger>Why use PalMirror Secure?</AccordionTrigger>
          <AccordionContent className="flex flex-col gap-2">
            <p>
              By using PalMirror Secure, your chats can be securely saved
              locally on the device with encryption. You no longer have to
              continuously export and import chats.
            </p>
            <ul className="list-disc pl-5">
              <li className="flex gap-2">
                <Check /> Local storage of chats
              </li>
              <li className="flex gap-2">
                <Check /> Enhanced privacy with encryption
              </li>
              <li className="flex gap-2">
                <Check /> Requires a password to unlock your chats
              </li>
              <li className="flex gap-2">
                <Check /> Easy setup
              </li>
            </ul>
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Can I verify with my biometrics?</AccordionTrigger>
          <AccordionContent className="flex flex-col gap-2">
            <p>
              Absolutely! PalMirror Secure supports passkeys that allows you to
              verify with your device&apos;s lock, such as fingerprint.
              <br />
              <br />
              If you have setup PalMirror Secure already, setup your passkey
              with the button below!
            </p>
            <Button onClick={() => setShowPasskeySetupDrawer(true)}>
              Setup passkey
            </Button>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      {/* Passkey Setup drawer  */}
      <Drawer
        open={showPasskeySetupDrawer}
        onOpenChange={(open) => setShowPasskeySetupDrawer(open)}
      >
        <DrawerContent className="px-6 font-sans">
          <DrawerHeader>
            <DrawerTitle>Passkey setup</DrawerTitle>
          </DrawerHeader>
          <p className="mb-3 block">
            Verify your password/PIN to create a passkey.
          </p>
          <Input
            type="password"
            value={passkeyVerification}
            onChange={(e) => setPasskeyVerification(e.target.value)}
          />
          <Accordion type="single" collapsible className="w-full mb-4">
            <AccordionItem value="item-1">
              <AccordionTrigger>
                Technical security consideration
              </AccordionTrigger>
              <AccordionContent className="flex flex-col gap-2">
                <p>
                  While convenient, passkey handling is done <b>purely local</b>{" "}
                  and does{" "}
                  <b>rely on ANY server at all to guarantee security.</b> With
                  that said, your PalMirror Secure key can be technically{" "}
                  <b>
                    hacked by a determined hacker IF they have access to your
                    browser and device,
                  </b>{" "}
                  so please be responsible with{" "}
                  <b>locking your device within the OS.</b> PalMirror will do
                  its best to maximize your security and privacy with PalMirror
                  Secure.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          <DrawerFooter>
            <Button onClick={verifyAndCreatePasskey}>Create</Button>
            <DrawerClose>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
      {/* Complete drawer  */}
      <Drawer
        open={showCompleteDrawer}
        onOpenChange={(open) => setShowCompleteDrawer(open)}
      >
        <DrawerContent className="px-6 font-sans">
          <DrawerHeader>
            <DrawerTitle>PalMirror Secure is setup!</DrawerTitle>
          </DrawerHeader>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              mass: 1,
              stiffness: 190,
              damping: 10,
              delay: 0.2,
            }}
          >
            <Check size={128} className="block mx-auto" />
          </motion.div>
          <p>
            PalMirror will now ask you to unlock every app open. You can setup
            an optional <b>passkey</b> so you can unlock with{" "}
            <b>your biometrics such as fingerprint.</b>
          </p>
          <DrawerFooter>
            <Button
              onClick={() => {
                setShowCompleteDrawer(false);
                setShowPasskeySetupDrawer(true);
              }}
            >
              Setup Passkey
            </Button>
            <DrawerClose>
              <Button variant="outline">No thanks</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
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
