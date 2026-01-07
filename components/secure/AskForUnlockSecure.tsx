"use client";

import React, { useEffect, useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Keypad from "@/components/keypad/Keypad";
import PinDisplay from "@/components/keypad/PINDisplay";
import { usePMNotification } from "@/components/notifications/PalMirrorNotification";
import { useAnimation } from "motion/react";
import { PLMSecureContext } from "@/context/PLMSecureContext";

/* Props:
 * - open: whether dialog is visible
 * - onUnlock: callback when unlock succeeds (parent should set isSecureReady)
 * - onCancel?: optional callback when user cancels
 */
interface SecureUnlockDialogProps {
  open: boolean;
  onUnlock: () => void;
  onCancel?: () => void;
}

export default function AskForUnlockSecure({ open, onUnlock, onCancel }: SecureUnlockDialogProps) {
  const PLMsecureContext: any = React.useContext(PLMSecureContext);
  const PMNotify = usePMNotification();

  const lockAnim = useAnimation();
  const [pass, setPass] = useState("");
  const [passkeyOngoing, setPasskeyOngoing] = useState(false);

  const secureMetadata = typeof window !== "undefined" ? localStorage.getItem("secureMetadata") : null;
  const pinLength = secureMetadata ? JSON.parse(secureMetadata).length : 0;
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (pinLength > 0 && pass.length === pinLength) {
      setTimeout(() => attemptUnlock(pass), 50);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pass]);

  const handleKeyPressPin = (key: string) => {
    if (key === "⌫") {
      setPass((p) => p.slice(0, -1));
    } else if (pass.length < pinLength) {
      setPass((p) => p + key);
    }
  };

  async function attemptUnlock(key?: string) {
    const unlockingKey = key ?? pass;
    if (!unlockingKey || unlockingKey.length === 0) {
      PMNotify.error("Please enter a passcode.");
      return;
    }

    setPasskeyOngoing(true);
    try {
      const setKeySuccessful = await PLMsecureContext?.setKey(unlockingKey);
      setPass("");
      setPasskeyOngoing(false);

      if (!setKeySuccessful) {
        // incorrect key handling
        PMNotify.error("Incorrect passcode.");
        return;
      }

      // success
      onUnlock();
    } catch (err) {
      console.error("Unlock error:", err);
      PMNotify.error("Failed to unlock.");
      setPasskeyOngoing(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && onCancel) onCancel(); }}>
      <DialogContent className="w-full max-w-md">
        <DialogHeader>
          <DialogTitle>Verify secure</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col items-center">
            {pinLength > 0 ? (
              <>
                <PinDisplay input={pass} show={false} many={pinLength} />
                <div className="mt-2 w-full">
                  <Keypad onKeyPress={handleKeyPressPin} fromBottom={true} />
                </div>
              </>
            ) : (
              <>
                <div className="w-full">
                  <Input
                    ref={inputRef}
                    type="password"
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") attemptUnlock(); }}
                    placeholder="Enter password"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
