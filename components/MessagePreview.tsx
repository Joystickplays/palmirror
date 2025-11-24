import { useEffect, useState } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "./ui/drawer";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import ReactMarkdown from 'react-markdown';
import { Textarea } from "./ui/textarea";
import { AnimateChangeInHeight } from "./AnimateHeight";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";

interface MessagePreviewProps {
  open: boolean;
  setOpen: (state: boolean) => void;
  content: string;
  approved: (content: string) => void;
}

export const MessagePreview: React.FC<MessagePreviewProps> = ({ open, setOpen, content, approved }) => {
  const [text, setText] = useState(content);

  const [editing, setEditing] = useState(false);

  useEffect(() => {
    setText(content)
  }, [content])

  return (
    <Drawer repositionInputs={false} open={open} onOpenChange={setOpen} dismissible={false}>
      <DrawerContent className="w-auto max-w-[750px] min-w-[50vw] font-sans overflow-y-visible px-4 md:px-12 pb-6">
        <div className="max-h-[80vh] overflow-y-auto">
          <div>
            <DrawerHeader>
              <DrawerTitle className="mb-2 text-center">Preview generated message</DrawerTitle>
            </DrawerHeader>
            <AnimateChangeInHeight className={`border border-white/10 text-right rounded-xl`}>
              <div className={`p-3 ${editing && "!p-1"}`}>
                <CardContent className="p-2">
                  <AnimatePresence mode="popLayout">
                    {
                      !editing ? (
                        <motion.div
                          key={"finalVisual"}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ type: 'spring', mass: 1, stiffness: 160, damping: 16 }}>
                          <ReactMarkdown className="markdown-content ml-auto">
                            {text}
                          </ReactMarkdown>
                        </motion.div>
                      ) : (
                        <motion.div
                          key={"textEditing"}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0 }}
                          transition={{ type: 'spring', mass: 1, stiffness: 160, damping: 16 }}>
                          <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={10}>
                          </Textarea>
                        </motion.div>

                      )
                    }
                  </AnimatePresence>
                </CardContent>
              </div>
            </AnimateChangeInHeight>
            <div className="flex gap-2">
              <DrawerClose asChild>
                <Button disabled={editing} onClick={() => { setOpen(false); approved(text) }} className="mt-5 w-full"><Check /> Approve</Button>
              </DrawerClose>
              <Button onClick={() => {
                setEditing(!editing)
              }} variant="outline" className="mt-5 w-full">{!editing ? "Edit" : "Apply"}</Button>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}