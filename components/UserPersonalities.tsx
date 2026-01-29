import { motion, AnimatePresence } from "framer-motion";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CirclePlus, Trash2 } from "lucide-react";

import { v4 as uuidv4 } from "uuid";


const MButton = motion(Button);

type UserPersonality = {
  id: string
  name: string
  personality: string
  using: boolean
}

const UserPersonalities: React.FC = ({ }) => {
  const [userPersonalities, setUserPersonalities] = useState<UserPersonality[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const [queueId, setQueueId] = useState(uuidv4());

  const newPersonality = () => {
    setUserPersonalities((usp) => [
      {
        id: queueId,
        name: "A beautiful name",
        personality: "A beautiful personality, lore and backstory",
        using: false,
      },
      ...usp,
    ]);
    setQueueId(uuidv4());
  };

  useEffect(() => {
    const stored = localStorage.getItem("userPersonalities");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);

        const updated = parsed.map((item: UserPersonality) => ({
          ...item,
          id: item.id || uuidv4(),
        }));

        setUserPersonalities(updated);
      } catch (err) {
        console.error("Failed to parse personalities from localStorage", err);
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(
        "userPersonalities",
        JSON.stringify(userPersonalities),
      );
    }
  }, [userPersonalities, hydrated]);

  const setUsing = (index: number) => {
    setUserPersonalities((usp) =>
      usp.map((item, i) => ({ ...item, using: i === index })),
    );
  };

  return (
    <>
      <div>
        <div className="flex flex-col items-center justify-center">
          <h2 className="text-2xl font-bold mb-4 palmirror-exc-text self-start">
            Your Personalities
          </h2>
        </div>
        <AnimatePresence mode="popLayout">
          <div className="grid grid-cols-1 lg:grid-cols-3 items-stretch justify-center gap-2">
            <MButton
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', mass: 1, stiffness: 100, damping: 16 }}
              key={queueId}
              layoutId={queueId}
              onClick={newPersonality}
              variant="outline"
              className="w-[310px] h-full text-xl mb-8 hover:bg-black/0 flex flex-col justify-center items-center"
            >
              <CirclePlus className="h-24 w-24" />
              Create new
            </MButton>
            {userPersonalities.map((usrPs, i) => (
              <motion.div
                key={usrPs.id}
                layoutId={usrPs.id}
                initial={{ scale: 1, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.7, opacity: 0 }}
                layout
                transition={{ type: "spring", stiffness: 100, damping: 17 }}
                className="border rounded-xl p-4 flex flex-col gap-2 max-w-[310px]"
              >
                <Input
                  placeholder="Name"
                  className="font-extrabold text-2xl h-[65px]"
                  value={usrPs.name}
                  onChange={(e) => {
                    setUserPersonalities((usrPses) =>
                      usrPses.map((usrPsEdit, iEdit) =>
                        iEdit === i
                          ? { ...usrPsEdit, name: e.target.value }
                          : usrPsEdit,
                      ),
                    );
                  }}
                ></Input>
                <Textarea
                  placeholder="Personality, lore, drop it all here"
                  value={usrPs.personality}
                  onChange={(e) => {
                    setUserPersonalities((usrPses) =>
                      usrPses.map((usrPsEdit, iEdit) =>
                        iEdit === i
                          ? { ...usrPsEdit, personality: e.target.value }
                          : usrPsEdit,
                      ),
                    );
                  }}
                ></Textarea>
                <div className="flex flex-row gap-2 mt-2">
                  <AnimatePresence mode="popLayout">
                    {usrPs.using ? (
                      <motion.div
                        key={"stopUsing"}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1.06 }}
                        exit={{ opacity: 0, scale: 0.6 }}
                        transition={{ type: "spring", stiffness: 150, damping: 17, }}
                        className="flex-1 w-full"
                      >
                        <Button
                          variant="default"
                          className="w-full"
                          onClick={() => setUsing(-1)}
                        >
                          Stop using
                        </Button>
                      </motion.div>
                    ) : (
                      <motion.div
                        key={"useThis"}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.6 }}
                        transition={{ type: "spring", stiffness: 150, damping: 17, }}
                        className="flex-1"
                      >
                        <Button
                          variant="outline"
                          className="w-full flex-1"
                          onClick={() => setUsing(i)}
                        >
                          Use this
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Button
                    variant="destructive"
                    className=""
                    onClick={() => {
                      setUserPersonalities((usrPses) =>
                        usrPses.filter((_, iDel) => iDel !== i),
                      );
                    }}
                  >
                    <Trash2 className="h-24 w-24" />
                    Delete
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      </div>
    </>
  );
};

export default UserPersonalities;
