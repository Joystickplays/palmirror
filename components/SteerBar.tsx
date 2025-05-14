import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShipWheel, Trash } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { AnimatePresence, motion } from "framer-motion";
import { AnimateChangeInHeight } from "@/components/AnimateHeight";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface SteerBarProps {
  activeSteers: string[];
  addSteer: (steer: string) => void;
  removeSteer: (index: number) => void;
  steerApplyMethod: string;
  setSteerApplyMethod: React.Dispatch<React.SetStateAction<string>>;
  callSteer: () => void;
  isThinking: boolean;
  manageSteerModal: boolean;
  setManageSteerModal: React.Dispatch<React.SetStateAction<boolean>>;
}

const SteerBar: React.FC<SteerBarProps> = ({
  activeSteers,
  addSteer,
  removeSteer,
  steerApplyMethod,
  setSteerApplyMethod,
  callSteer,
  isThinking,
  manageSteerModal,
  setManageSteerModal,
}) => {
  const [newSteer, setNewSteer] = useState("");
  const [rudderRot, setRudderRot] = useState(0);

  const rotateRudder = () => {
    setRudderRot((prev) => prev + Math.floor(Math.random() * 91) - 90);
  };

  useEffect(() => {
    if (manageSteerModal) return;
    let attempts = 0;
    const id = setInterval(() => {
      document.body.style.pointerEvents = "auto";
      if (++attempts >= 10) clearInterval(id);
    }, 200);
    return () => clearInterval(id);
  }, [manageSteerModal]);

  return (
    <>
      {activeSteers.length > 0 /* then exit animation is just GONE. bleh */ ? (
        <div className="relative w-full">
          <AnimatePresence>
            {activeSteers.length > 0 && (
              <motion.div
                key="steerBar"
                initial={{ scale: 0, height: 0, margin: 0 }}
                animate={{ scale: 1, height: "fit-content" }}
                exit={{ height: 0, opacity: 0, margin: 0, padding: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 16 }}
                className="opacity-50 text-sm px-2 flex gap-2 items-center origin-bottom overflow-y-hidden"
              >
                <ShipWheel />
                <p>
                  {activeSteers.length} Steer{activeSteers.length > 1 ? "s" : ""}{" "}
                  {activeSteers.length > 1 ? "are" : "is"} active
                  {/* english(tm) */}
                </p>
                <div className="flex overflow-x-auto gap-2 ml-auto max-w-[170px]">
                  <Button
                    variant="outline"
                    className="h-6 px-2 py-0 text-xs opacity-75"
                    onClick={() => setManageSteerModal(true)}
                  >
                    MANAGE STEERING
                  </Button>
                  <Button
                    variant="outline"
                    className="h-6 px-2 py-0 text-xs opacity-75"
                    disabled={isThinking}
                    onClick={callSteer}
                  >
                    CALL STEER
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : null}
      <div>
      <Dialog open={manageSteerModal} onOpenChange={setManageSteerModal}>
        <DialogContent className="max-h-[90vh] overflow-y-auto p-0 py-8">
          <AnimateChangeInHeight className="p-8 py-0">
            <DialogTitle className="text-center text-2xl mb-4">
              Steering
            </DialogTitle>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1, rotate: rudderRot }}
              transition={{
                type: "spring",
                stiffness: 50,
                damping: 8,
                scale: { type: "spring", stiffness: 100, damping: 15 },
              }}
            >
              <ShipWheel className="h-32 w-32 mx-auto" />
            </motion.div>
            <p className="px-4 text-center">
              Steer the story subtly and non-intrusively.
            </p>
            <p className="opacity-50 italic text-xs text-center mt-3">
              Steers do not save!
            </p>

            <h2 className="opacity-50 font-bold mt-6 mb-2">STEERS</h2>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2 mb-2">
                <Input
                  value={newSteer}
                  placeholder="New steer..."
                  onChange={(e) => setNewSteer(e.target.value)}
                />
                <Button
                  onClick={() => {
                    if (newSteer.trim()) {
                      addSteer(newSteer);
                      setNewSteer("");
                      rotateRudder();
                    }
                  }}
                >
                  Steer
                </Button>
              </div>

              <AnimatePresence>
                {activeSteers.map((steer, idx) => (
                  <motion.div
                    key={steer + idx}
                    initial={{ y: 50, opacity: 0, scale: 0.8 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 100,
                      damping: 16,
                      delay: idx * 0.05,
                    }}
                    className="border rounded-xl p-4 flex justify-between items-center"
                  >
                    <p className="break-words">{steer}</p>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => {
                        removeSteer(idx);
                        rotateRudder();
                      }}
                      className="ml-2"
                    >
                      <Trash />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>

              <h2 className="opacity-50 font-bold mt-6 mb-2">ADVANCED</h2>
              <p className="text-xs mb-1">Apply method</p>
              <Select
                value={steerApplyMethod}
                onValueChange={setSteerApplyMethod}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Apply method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">System instruction</SelectItem>
                  <SelectItem value="posthistory">
                    Post-history user message
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="opacity-50 text-xs">
                {steerApplyMethod === "system"
                  ? "Injects instructions at the top as system message. More subtle and natural."
                  : steerApplyMethod === "posthistory"
                    ? "Injects instructions as a user message at the bottom of the chat history. Stronger effects."
                    : "idfk"}
              </p>
            </div>
          </AnimateChangeInHeight>
        </DialogContent>
      </Dialog>
      </div>
    </>
  );
};

export default SteerBar;
