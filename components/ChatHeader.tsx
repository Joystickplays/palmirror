// components/ChatHeader.tsx
import React, { useEffect, useState, useContext } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useTheme } from '@/components/PalMirrorThemeProvider';
import { Settings, Check, BadgeInfo } from 'lucide-react';
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
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"

import { CharacterData } from "@/types/CharacterData";
import { useRouter } from 'next/navigation';
import { isPalMirrorSecureActivated, PLMSecureGeneralSettings } from '@/utils/palMirrorSecureUtils';
import { PLMSecureContext } from '@/context/PLMSecureContext';

import { pmPropSysInst } from '@/utils/palmirrorProprietarySysInst'

interface ChatHeaderProps {
  characterData: CharacterData;
  getExportedMessages: () => void;
  importMessages: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ characterData, getExportedMessages, importMessages }) => {
  const [baseURL, setBaseURL] = useState('https://cvai.mhi.im/v1');
  const [apiKey, setApiKey] = useState('');
  const [temperature, setTemperature] = useState(0.5);
  const [modelName, setModelName] = useState('');
  const [modelInstructions, setModelInstructions] = useState('');
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [inputChangedYet, setInputChangedYet] = useState(false);
  const [showSecureDialog, setShowSecureDialog] = useState(false);
  const [alreadyEncrypted, setAlreadyEncrypted] = useState(false);

  const [showReloadSuggestion, setShowReloadSuggestion] = useState(false);
  
  const [showPMSysInstSuggestion, setShowPMSysInstSuggestion] = useState(true);

  const PLMSecContext = useContext(PLMSecureContext);

  const { theme, getTheme, setTheme } = useTheme();
  const currentTheme = getTheme();
  const router = useRouter();

  const handleToggleRecommendations = () => {
    setShowRecommendations(!showRecommendations);
  };

  const handleProviderSelect = (provider: string) => {
    setSelectedProvider(provider);
  };

  const handleImport = () => {
    importMessages();
  };

  const loadSettingsFromLocalStorage = () => {
    const settings = localStorage.getItem('Proxy_settings');
    if (settings) {
      const parsedSettings = JSON.parse(settings);
      setBaseURL(parsedSettings.baseURL || '');
      setModelName(parsedSettings.modelName || '');
      setTemperature(parseFloat(parsedSettings.temperature) || 0.5);
      setModelInstructions(parsedSettings.modelInstructions || '')
    } else {
      setBaseURL("https://cvai.mhi.im/v1")
    }
  }

  // load AaaaHHHHHHHHHHH leave me alone
  useEffect(() => {
    if (localStorage.getItem("PMPSIDontShowAgain")) {
      setShowPMSysInstSuggestion(false)
    }
  }, [])

  // load normal localstorage thing
  useEffect(() => {
    loadSettingsFromLocalStorage();
  }, []);

  // load secure thing
  useEffect(() => {
    const loadSecureSettings = async () => {
      if (PLMSecContext) {
        const proxySettings = await PLMSecContext.getSecureData('generalSettings') as PLMSecureGeneralSettings;
        setApiKey(proxySettings.proxy.api_key);
      }
    };
    loadSecureSettings();
  }, [])

  const saveSettings = () => {
    const settings = { baseURL, modelName, temperature, modelInstructions };
    localStorage.setItem('Proxy_settings', JSON.stringify(settings));
  }

  useEffect(() => {
    if (inputChangedYet) {
      saveSettings()
    }
  }, [baseURL, modelName, temperature, modelInstructions]);

  useEffect(() => {
    console.log(theme)
  }, [theme])

  useEffect(() => {
    const checkEncryptionStatus = async () => {
      try {
        const activated = await isPalMirrorSecureActivated();
        setAlreadyEncrypted(activated);
      } catch (error) {
        console.error('Failed to check encryption status:', error);
      }
    };

    checkEncryptionStatus();
  }, []);

  const handleBaseURLChange = (event: React.ChangeEvent<HTMLInputElement> | string) => {
    const value = typeof event === 'string' ? event : event.target.value;
    setBaseURL(value);
    setInputChangedYet(true);
    setShowReloadSuggestion(true);
  };
  
  const secureAPIKeySave = async () => {
    // debugger;
    if (PLMSecContext) {
      const proxySettings = await PLMSecContext.getSecureData('generalSettings') as PLMSecureGeneralSettings;
      proxySettings.proxy.api_key = apiKey;
      await PLMSecContext.setSecureData('generalSettings', proxySettings);
      console.log("saved")
    }
  }

  const handleApiKeyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    //if (!alreadyEncrypted) {
    //  setShowSecureDialog(true);
    //  return;
    //}
    setApiKey(value);
    
    setInputChangedYet(true);
  };
  
  useEffect(() => {
    if (alreadyEncrypted) {
      const saveAsync = async () => {
        await secureAPIKeySave();
      }
      saveAsync();
    }
  }, [apiKey])

  const handleModelNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setModelName(value);
    setInputChangedYet(true);
  };

  const handleModelInstructionsChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    setModelInstructions(value);
    setInputChangedYet(true);
  };

  const handleTemperatureChange = (value: number[]) => {
    setTemperature(value[0]);
    setInputChangedYet(true);
  }

  return (
    <Card>
    <Drawer repositionInputs={false} direction={"right"}>

      <CardContent className={`flex relative justify-between items-center p-5 w-full ${currentTheme.bg} overflow-hidden rounded-lg`}>

        {characterData.image !== "" && (
          <img src={characterData.image !== "" ? characterData.image : undefined}
          style={{ maskImage: 'linear-gradient(to right, rgba(0, 0, 0, 0.3), transparent)' }}
          className="absolute inset-0 top-0 left-0 right-0 bottom-0 w-full h-full object-cover rounded-lg object-[50%_35%] blur-[3px] hover:blur-none active:blur-none scale-110 hover:scale-100 active:scale-100 transition duration-300 ease-out" />
        )}
        <div className="flex gap-1 flex-col">
          <h2 className="z-[2]"><span className="font-bold">{characterData.name}</span></h2>
          <p className="text-xs font-bold opacity-50">On PalMirror</p>
        </div>
          <DrawerTrigger asChild>
            <Button variant="outline" className={`p-3 size-8 z-[2] ${currentTheme.assistantBg}`}><Settings /></Button>
          </DrawerTrigger>
          <DrawerContent className={`w-auto max-h-[88vh] max-w-[350px] sm:max-h-auto ml-10 sm:ml-auto mr-3 mb-4 rounded-xl overflow-x-hidden font-sans ${showSecureDialog && "blur-sm"}`}
          style={{ '--initial-transform': 'calc(100% + 16px)' } as React.CSSProperties}>
            <div className="overflow-y-auto overflow-x-hidden">
            <DrawerHeader>
              <DrawerTitle className="mb-8">Chat settings</DrawerTitle>
              <h2 className="my-4 font-bold">AI Provider settings</h2>
              <div className="py-4 flex flex-col gap-2">
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="Proxy_baseURL">Base URL</Label>
                  <Input
                    id="Proxy_baseURL"
                    placeholder="https://awesome.llm/v1"
                    value={baseURL}
                    onChange={handleBaseURLChange}
                  />
                  {showReloadSuggestion && ( <p className="opacity-50 text-xs">Base URL changes require a <Button variant="outline" className="!p-2" onClick={() => window.location.reload()}>reload</Button> to work properly.</p> )}
                  <Button variant="outline" size="sm" onClick={handleToggleRecommendations}>
                    {showRecommendations ? "Hide Recommendations" : "Show Recommendations"}
                  </Button>
                  {showRecommendations && (
                    <Card>
                      <CardContent className="flex flex-col gap-3 !p-4">
                        <p className="text-xs opacity-50">Recommendations</p>
                        <div className="flex gap-4">
                          <Button variant="outline" size="sm" onClick={() => handleProviderSelect("OpenAI")}>OpenAI</Button>
                          <Button variant="outline" size="sm" onClick={() => handleProviderSelect("PalAI")}>PalAI</Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {showRecommendations && selectedProvider === "OpenAI" && (
                    <Card className="mt-4">
                      <CardContent className="font-sans p-3">
                        <p>OpenAI is a leading AI research lab. They provide a powerful API for text generation.</p>
                        <div className="flex flex-col gap-1 !my-4 p-2 border rounded-lg">
                          <p className="flex gap-2 text-sm"><Check className="opacity-50" /> Excellent quality</p>
                          <p className="flex gap-2 text-sm"><Check className="opacity-50" /> Fast responses</p>
                          <p className="flex gap-2 text-sm"><Check className="opacity-50" /> Uses industry-leading AI models</p>
                          <p className="flex gap-2 text-sm"><Check className="opacity-0" /> May be more restricted/censored</p>
                        </div>
                        <Button onClick={() => { handleBaseURLChange("https://api.openai.com/v1"); handleProviderSelect("");  }}>Use this provider as base URL</Button>
                      </CardContent>
                    </Card>
                  )}
                  {showRecommendations && selectedProvider === "PalAI" && (
                    <Card className="mt-4">
                      <CardContent className="font-sans p-3">
                        <p>PalAI is the proprietary PalMirror AI provider and the default, using OpenRouter to give you access to flagship, openweight models for free. Thanks to <a href="https://hostedon.mochig.com" target="_blank" className="text-blue-300 underline">Mochig</a> for hosting!</p>
                        <div className="flex flex-col gap-1 !my-4 p-2 border rounded-lg">
                          <p className="flex gap-2 text-sm"><Check className="opacity-50" /> Made for PalMirror</p>
                          <p className="flex gap-2 text-sm"><Check className="opacity-50" /><b>No</b> API Keys</p>
                          <p className="flex gap-2 text-sm"><Check className="opacity-50" /><b>No</b> response logging</p>
                          <p className="flex gap-2 text-sm"><Check className="opacity-50" /> Flagship openweight models</p>
                          <p className="flex gap-2 text-sm"><Check className="opacity-50" /> Uncensored most of the time</p>
                        </div>
                        <Button onClick={() => { handleBaseURLChange("https://cvai.mhi.im/v1"); handleProviderSelect(""); }}>Use this provider as base URL</Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
                <div className="grid w-full items-center gap-1.5 my-5">
                  <Label htmlFor="Proxy_apiKey">API key</Label>
                  <Input
                    id="Proxy_apiKey"
                    value={apiKey}
                    onChange={handleApiKeyChange}
                    disabled={!alreadyEncrypted}
                    type="password"
                  />
                  {!alreadyEncrypted && (
                  <div className="flex flex-col gap-2 mt-2 border rounded-xl p-4">
                    <p>To use your API Keys, please setup PalMirror Secure for secure encryption. </p> <Button onClick={() => router.push('/secure')}>Setup PalMirror Secure</Button>
                  </div>
                  )}
                </div>
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="Proxy_modelName">Model Name</Label>
                  <Input
                    id="Proxy_modelName"
                    placeholder="e.g., gpt-3.5-turbo"
                    value={modelName}
                    onChange={handleModelNameChange}
                  />
                </div>
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="Proxy_modelInstructions">Custom instructions</Label>
                  <Textarea
                    id="Proxy_modelInstructions"
                    placeholder="! If custom instructions seem to worsen the responses, consider not using this."
                    value={modelInstructions}
                    onChange={handleModelInstructionsChange}>
                  </Textarea>
                  {showPMSysInstSuggestion ? (
                    <div className="border p-4 w-full rounded-xl text-center">
                    <h1 className="font-extrabold">PalMirror Proprietary Prompt</h1>
                    <p className="text-xs mt-1">Guide generic assistant LLMs to <i>specifically</i> generate for immersive roleplay!</p>
                    <div className="flex flex-col gap-2 w-full mt-4">
                      <Button className="flex-grow" onClick={() => {setModelInstructions(pmPropSysInst); setInputChangedYet(true);}}>Use P3</Button>
                      <Button variant="outline" size="sm" onClick={() => {setShowPMSysInstSuggestion(false); localStorage.setItem("PMPSIDontShowAgain", "hi everybody")}} >Don't show again</Button>
                    </div>
                  </div>
                  ) : null}
                </div>
              </div>
              <h2 className="my-4 font-bold">AI generation settings</h2>
              <div>
                <div className="flex row justify-between mb-4">
                  <Label>Temperature</Label>
                  <Label className="font-bold">{temperature}</ Label>
                </div>
                <Slider defaultValue={[0.5]} min={0} max={1.5} step={0.01} onValueChange={(val: number[]) => { handleTemperatureChange(val) }} />
              </div>
              <div className="flex gap-2 pt-8">
                <Button onClick={getExportedMessages}>Export chat</Button>
                <Button onClick={handleImport}>Import chat</Button>
              </div>
              <Select onValueChange={setTheme}>
                <SelectTrigger className="w-full mt-5">
                  <SelectValue placeholder="Theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="palmirror">PalMirror Original</SelectItem>
                  <SelectItem value="palmirrorSunset">PalMirror Sunset</SelectItem>
                  <SelectItem value="palmirrorOceans">PalMirror Oceans</SelectItem>
                  <SelectItem value="cai">c.ai</SelectItem>
                </SelectContent>
              </Select>
            </DrawerHeader>
            </div>
          </DrawerContent>
      </CardContent>
        </Drawer>
    </Card>
  );
};

export default ChatHeader;
