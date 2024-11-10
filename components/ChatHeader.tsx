// components/ChatHeader.tsx
import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Settings } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ChatHeaderProps {
  characterName: string;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ characterName }) => {
  const [baseURL, setBaseURL] = useState('');
  const [apiKey, setApiKey] = useState('');

  // Load values from localStorage on mount
  useEffect(() => {
    const savedBaseURL = localStorage.getItem('Proxy_baseURL');
    const savedApiKey = localStorage.getItem('Proxy_apiKey');
    if (savedBaseURL) setBaseURL(savedBaseURL);
    if (savedApiKey) setApiKey(savedApiKey);
  }, []);

  // Save values to localStorage whenever they change
  const handleBaseURLChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setBaseURL(value);
    localStorage.setItem('Proxy_baseURL', value);
  };

  const handleApiKeyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setApiKey(value);
    localStorage.setItem('Proxy_apiKey', value);
  };

  return (
    <Card>
      <CardContent className='flex justify-between items-center p-5 w-full'>
        <h2>PalMirror · <span className="font-bold">{characterName}</span></h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="p-3 size-8"><Settings /></Button>
          </DialogTrigger>
          <DialogContent className="w-auto max-h-[80vh] min-w-96 overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="mb-8">Chat settings</DialogTitle>
              <h2 className="my-4 font-bold">AI Provider settings</h2>
              <div className="py-4">
                <div className="grid w-full items-center gap-1.5 w-80">
                  <Label htmlFor="Proxy_baseURL">Base URL</Label>
                  <Input
                    id="Proxy_baseURL"
                    placeholder="https://awesome.llm/v1/chat/completions"
                    value={baseURL}
                    onChange={handleBaseURLChange}
                  />
                </div>
                <div className="grid w-full items-center gap-1.5 w-80 my-5">
                  <Label htmlFor="Proxy_apiKey">API key</Label>
                  <Input
                    id="Proxy_apiKey"
                    value={apiKey}
                    onChange={handleApiKeyChange}
                  />
                </div>
              </div>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default ChatHeader;
