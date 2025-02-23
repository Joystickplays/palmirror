import React from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button";

interface NewcomerDrawerProps {
  open: boolean,
  close: () => void,
}

const NewcomerDrawer: React.FC<NewcomerDrawerProps> = ({
  open,
  close,
}) => {

  const onChange = (op: boolean) => {
    if (!op) {
      close()
    }
  }
 
  return (
    <Drawer open={open} dismissible={false} onOpenChange={onChange}>
      <DrawerContent className="font-sans !text-left">
        <DrawerHeader>
          <DrawerTitle>Welcome to PalMirror!</DrawerTitle>
          <DrawerDescription>While PalMirror is traditionally a bring-your-own-AI character chat frontend, we also provide PalAI, a free AI service for newcomers made for PalMirror by default. Here are some alternatives you may like:
          </DrawerDescription>
          <div className="border rounded-lg my-2 p-4 text-left">
            <h1 className="font-extrabold text-2xl w-full">Recommendations</h1>
            <div className="flex flex-col gap-2 pt-4">
              <div>
                <h2 className="text-xl  underline"><a href="https://openai.com">OpenAI</a></h2>
                <p className="opacity-50 text-sm">Mainstream provider that holds flagship models and one of the strongests LLMs.</p>
              </div>
              <div>
                <h2 className="text-xl  underline"><a href="https://openrouter.ai">OpenRouter</a></h2>
                <p className="opacity-50 text-sm">A unified gateway for various AI platforms, requiring just one key to access a ton of providers. A &lt;1$ allowance is granted on signup.</p>
              </div>
            </div>
          </div>
        </DrawerHeader>
        <DrawerFooter>
          <DrawerClose>
            <Button onClick={close} className="w-full">Let's start chatting!</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
   </Drawer>

  );
};

export default NewcomerDrawer;
