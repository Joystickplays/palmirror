import React, { useEffect, useState, useContext, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useTheme } from '@/context/PalMirrorThemeProvider';
import { Settings, Check, Plus, Trash2, Power, AlertCircle } from 'lucide-react';
import {
  Drawer,
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

import { isPalMirrorSecureActivated, PLMSecureGeneralSettings } from '@/utils/palMirrorSecureUtils';
import { PLMSecureContext } from '@/context/PLMSecureContext';
import { pmPropSysInst } from '@/utils/palmirrorProprietarySysInst'
import { useRouter } from 'next/navigation';
import { usePLMGlobalConfig } from '@/context/PLMGlobalConfig';

interface ChatSettingsProps {
  getExportedMessages: () => void;
  importMessages: () => void;
}

export interface ApiProfile {
  id: string;
  name: string;
  baseURL: string;
  modelName: string;
  cascade?: {
    working: boolean;
    priority: number;
  }
}


const ChatSettings: React.FC<ChatSettingsProps> = ({ getExportedMessages, importMessages }) => {
  
  const PLMGC = usePLMGlobalConfig();
  const [configCascadingApiProviders, setConfigCascadingApiProviders] = useState(false);
  
  useEffect(() => {
      setConfigCascadingApiProviders(!!PLMGC.get("cascadingApiProviders"))
  }, [])
  
  const [profiles, setProfiles] = useState<ApiProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string>('default');
  
  const [baseURL, setBaseURL] = useState('https://cvai.mhi.im/v1');
  const [apiKey, setApiKey] = useState('');
  const [temperature, setTemperature] = useState(0.5);
  const [reasoningEffort, setReasoningEffort] = useState(0);
  const reasoningEffortLabels = [
    "None",
    "Minimal",
    "Low",
    "Medium",
    "High"
  ]
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

  const isSwitchingProfile = useRef(false);

  const handleToggleRecommendations = () => {
    setShowRecommendations(!showRecommendations);
  };

  const handleProviderSelect = (provider: string) => {
    setSelectedProvider(provider);
  };

  const handleImport = () => {
    importMessages();
  };

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const loadSettings = () => {
    const savedProfiles = localStorage.getItem('Proxy_profiles');
    let loadedProfiles: ApiProfile[] = [];

    const settings = localStorage.getItem('Proxy_settings');
    let parsedSettings: any = {};

    if (settings) {
      parsedSettings = JSON.parse(settings);
      setBaseURL(parsedSettings.baseURL || '');
      setModelName(parsedSettings.modelName || '');
      setTemperature(parseFloat(parsedSettings.temperature) || 0.5);
      setReasoningEffort(parseInt(parsedSettings.reasoningEffort) || 0);
      setModelInstructions(parsedSettings.modelInstructions || '');
    } else {
      setBaseURL("https://cvai.mhi.im/v1");
    }

    if (savedProfiles) {
      loadedProfiles = JSON.parse(savedProfiles);
    } else {
      loadedProfiles = [{
        id: 'default',
        name: 'Default',
        baseURL: parsedSettings.baseURL || 'https://cvai.mhi.im/v1',
        modelName: parsedSettings.modelName || '',
        cascade: { working: true, priority: 1 }
      }];
      localStorage.setItem('Proxy_profiles', JSON.stringify(loadedProfiles));
    }

    setProfiles(loadedProfiles);
    
    const lastActive = localStorage.getItem('Proxy_lastActiveId');
    if (lastActive && loadedProfiles.find(p => p.id === lastActive)) {
      setActiveProfileId(lastActive);
    } else {
      setActiveProfileId(loadedProfiles[0].id);
    }
  };

  useEffect(() => {
    loadSettings();

    if (localStorage.getItem("PMPSIDontShowAgain")) {
      setShowPMSysInstSuggestion(false)
    }

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

  useEffect(() => {
    const loadSecureKey = async () => {
      if (!PLMSecContext || !activeProfileId) return;

      isSwitchingProfile.current = true;

      try {
        let profileKey = await PLMSecContext.getSecureData(`apiKey_${activeProfileId}`);
        
        if (!profileKey && activeProfileId === 'default') {
           const proxySettings = await PLMSecContext.getSecureData('generalSettings') as PLMSecureGeneralSettings;
           if (proxySettings) profileKey = proxySettings.proxy.api_key;
        }

        const keyString = (typeof profileKey === 'object' && profileKey !== null && 'value' in profileKey) 
                          ? (profileKey as any).value 
                          : (profileKey || '');
                          
        setApiKey(keyString as string);
      } catch (e) {
        console.error(e);
      } finally {
        isSwitchingProfile.current = false;
      }
    };

    loadSecureKey();
  }, [activeProfileId, PLMSecContext]);


  const saveAllSettings = async (
    newBaseURL: string, 
    newModelName: string, 
    newApiKey: string,
    newProfiles: ApiProfile[],
    currentProfileId: string
  ) => {
    if (isSwitchingProfile.current) return;

    const legacySettings = { 
      baseURL: newBaseURL, 
      modelName: newModelName, 
      temperature, 
      modelInstructions, 
      reasoningEffort 
    };
    localStorage.setItem('Proxy_settings', JSON.stringify(legacySettings));

    const updatedProfiles = newProfiles.map(p => {
      if (p.id === currentProfileId) {
        return { ...p, baseURL: newBaseURL, modelName: newModelName };
      }
      return p;
    });
    localStorage.setItem('Proxy_profiles', JSON.stringify(updatedProfiles));
    setProfiles(updatedProfiles);

    if (PLMSecContext && alreadyEncrypted) {
      await PLMSecContext.setSecureData(`apiKey_${currentProfileId}`, { value: newApiKey });

      const proxySettings = await PLMSecContext.getSecureData('generalSettings') as PLMSecureGeneralSettings || { proxy: { api_key: '' } };
      proxySettings.proxy.api_key = newApiKey;
      await PLMSecContext.setSecureData('generalSettings', proxySettings);
    }
  };

  useEffect(() => {
    if (inputChangedYet && !isSwitchingProfile.current) {
      saveAllSettings(baseURL, modelName, apiKey, profiles, activeProfileId);
    }
  }, [baseURL, modelName, apiKey, temperature, modelInstructions, reasoningEffort, inputChangedYet]);

  const handleProfileSwitch = async (newProfileId: string) => {
    isSwitchingProfile.current = true;
    setInputChangedYet(false);
    
    const newProfile = profiles.find(p => p.id === newProfileId);
    if (!newProfile) {
        isSwitchingProfile.current = false;
        return;
    }

    setActiveProfileId(newProfileId);
    setBaseURL(newProfile.baseURL);
    setModelName(newProfile.modelName);
    localStorage.setItem('Proxy_lastActiveId', newProfileId);

    setApiKey('');

    const legacySettings = { 
        baseURL: newProfile.baseURL, 
        modelName: newProfile.modelName, 
        temperature, 
        modelInstructions, 
        reasoningEffort 
    };
    localStorage.setItem('Proxy_settings', JSON.stringify(legacySettings));

    setShowReloadSuggestion(true); 
  };

  const handleAddProfile = () => {
    const newId = generateId();
    const newProfile: ApiProfile = {
      id: newId,
      name: `New Profile`,
      baseURL: 'https://cvai.mhi.im/v1',
      modelName: '',
      cascade: {
        working: true,
        priority: profiles.length + 1
      }
    };
    const newProfilesList = [...profiles, newProfile];
    setProfiles(newProfilesList);
    localStorage.setItem('Proxy_profiles', JSON.stringify(newProfilesList));
    
    handleProfileSwitch(newId);
  };

  const handleDeleteProfile = async () => {
    if (profiles.length <= 1) return;

    const newProfiles = profiles.filter(p => p.id !== activeProfileId);
    setProfiles(newProfiles);
    localStorage.setItem('Proxy_profiles', JSON.stringify(newProfiles));
    handleProfileSwitch(newProfiles[0].id);
  };

  const handleRenameProfile = (newName: string) => {
    const updatedProfiles = profiles.map(p => 
      p.id === activeProfileId ? { ...p, name: newName } : p
    );
    setProfiles(updatedProfiles);
    localStorage.setItem('Proxy_profiles', JSON.stringify(updatedProfiles));
  };

  const handleCascadePriorityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    const updatedProfiles = profiles.map(p => {
      if (p.id === activeProfileId) {
        return { 
          ...p, 
          cascade: {
            working: p.cascade?.working ?? true,
            priority: isNaN(val) ? 0 : val
          }
        };
      }
      return p;
    });
    setProfiles(updatedProfiles);
    localStorage.setItem('Proxy_profiles', JSON.stringify(updatedProfiles));
  };

  const handleCascadeStatusToggle = () => {
    const updatedProfiles = profiles.map(p => {
      if (p.id === activeProfileId) {
        const currentWorking = p.cascade?.working ?? true;
        return { 
          ...p, 
          cascade: {
            working: !currentWorking,
            priority: p.cascade?.priority ?? 1
          }
        };
      }
      return p;
    });
    setProfiles(updatedProfiles);
    localStorage.setItem('Proxy_profiles', JSON.stringify(updatedProfiles));
  };

  useEffect(() => {
    const trySaveApiKeyNow = async () => {
      if (!PLMSecContext || !alreadyEncrypted) return;
      await saveAllSettings(baseURL, modelName, apiKey, profiles, activeProfileId);
    };
    trySaveApiKeyNow();
  }, [alreadyEncrypted]);


  const handleBaseURLChange = (event: React.ChangeEvent<HTMLInputElement> | string) => {
    const value = typeof event === 'string' ? event : event.target.value;
    setBaseURL(value);
    setInputChangedYet(true);
    setShowReloadSuggestion(true);
  };

  const handleApiKeyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setApiKey(value);
    setInputChangedYet(true);
    setShowReloadSuggestion(true);
  };

  const handleModelNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setModelName(value);
    setInputChangedYet(true);
    setShowReloadSuggestion(true);
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

  const handleReasoningEffortChange = (value: number[]) => {
    setReasoningEffort(value[0]);
    setInputChangedYet(true);
  }

  const currentProfile = profiles.find(p => p.id === activeProfileId);
  const isProfileWorking = currentProfile?.cascade?.working ?? true;

  return (
    <Drawer repositionInputs={false} direction={"right"} onOpenChange={(open) => { if (open) loadSettings() }}>
      <DrawerTrigger asChild>
        <Button variant="outline" className={`p-3 size-8 z-2 ${currentTheme.assistantBg}`}><Settings /></Button>
      </DrawerTrigger>
      <DrawerContent className={`w-auto max-h-[80vh] max-w-[350px] sm:max-h-auto ml-10 sm:ml-auto mr-3 mb-4 rounded-xl overflow-x-hidden font-sans ${showSecureDialog && "blur-xs"} `}
        style={{ '--initial-transform': 'calc(100% + 16px)' } as React.CSSProperties}>
        <div className="overflow-y-auto overflow-x-hidden">
          <DrawerHeader>
            <DrawerTitle className="mb-4">Chat settings</DrawerTitle>

            <h2 className="my-4 font-bold">AI Provider settings</h2>
            <div className="flex flex-col gap-2 mb-6 p-4 rounded-lg border border-white/10">
              <Label className="text-xs uppercase opacity-70 font-bold">API Profile</Label>
              <div className="flex gap-2 w-full">
                 <Select value={activeProfileId} onValueChange={handleProfileSwitch}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Profile" />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                           <span className={configCascadingApiProviders ? (p.cascade?.working !== false ? "text-green-500" : "text-red-500 opacity-70") : ""}>
                             {configCascadingApiProviders ? '● ' : ''}
                           </span>
                           {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                 </Select>
                 <Button variant="outline" size="icon" onClick={handleAddProfile}>
                   <Plus className="h-4 w-4" />
                 </Button>
              </div>
              
              <div className="flex items-center gap-2 mt-2">
                 <div className="flex flex-col gap-2">
                  <Label className="text-xs whitespace-nowrap opacity-60">Profile Name:</Label>
                  <Input 
                    className="h-7 text-sm" 
                    value={profiles.find(p => p.id === activeProfileId)?.name || ''}
                    onChange={(e) => handleRenameProfile(e.target.value)}
                  />
                 </div>
                 <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" 
                    onClick={handleDeleteProfile}
                    disabled={profiles.length <= 1}
                 >
                    <Trash2 className="h-4 w-4" />
                 </Button>
              </div>

              {configCascadingApiProviders && currentProfile && (<>
                <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                      <Label className="text-xs uppercase opacity-70 font-bold">Cascade Config</Label>
                      <div className={`text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${isProfileWorking ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                        {isProfileWorking ? "Working" : "Dormant"}
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-[10px] opacity-60">Priority (Lower = Higher)</Label>
                      <Input 
                        type="number" 
                        className="h-8"
                        value={currentProfile.cascade?.priority ?? 1}
                        onChange={handleCascadePriorityChange}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-[10px] opacity-60">Status</Label>
                      <Button 
                        variant={isProfileWorking ? "destructive" : "secondary"} 
                        className="h-8 text-xs w-full"
                        onClick={handleCascadeStatusToggle}
                      >
                         {isProfileWorking ? "Disable" : "Activate"}
                      </Button>
                    </div>
                  </div>
                  
                  {!isProfileWorking && (
                     <div className="flex gap-2 items-center p-2 rounded bg-red-500/10 border border-red-500/20 text-red-200">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <p className="text-[10px] leading-tight">This profile is marked as <b>Dormant</b>. It will be skipped in the cascade until manually reactivated.</p>
                     </div>
                  )}
                </div>
              </>)}

              {showReloadSuggestion && (
                <p className="opacity-50 text-xs mt-2">API changes require a <Button variant="outline" className="p-2!" onClick={() => window.location.reload()}>reload</Button> to work properly.</p>
              )}
            </div>
            <div className="py-4 flex flex-col gap-2">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="Proxy_baseURL">Base URL</Label>
                <Input
                  id="Proxy_baseURL"
                  placeholder="https://awesome.llm/v1"
                  value={baseURL}
                  onChange={handleBaseURLChange}
                />
                
                <Button variant="outline" size="sm" onClick={handleToggleRecommendations}>
                  {showRecommendations ? "Hide Recommendations" : "Show Recommendations"}
                </Button>
                {showRecommendations && (
                  <Card>
                    <CardContent className="flex flex-col gap-3 p-4!">
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
                      <div className="flex flex-col gap-1 my-4! p-2 border rounded-lg">
                        <p className="flex gap-2 text-sm"><Check className="opacity-50" /> Excellent quality</p>
                        <p className="flex gap-2 text-sm"><Check className="opacity-50" /> Fast responses</p>
                        <p className="flex gap-2 text-sm"><Check className="opacity-50" /> Uses industry-leading AI models</p>
                        <p className="flex gap-2 text-sm"><Check className="opacity-0" /> May be more restricted/censored</p>
                      </div>
                      <Button onClick={() => { handleBaseURLChange("https://api.openai.com/v1"); handleProviderSelect(""); }}>Use this provider as base URL</Button>
                    </CardContent>
                  </Card>
                )}
                {showRecommendations && selectedProvider === "PalAI" && (
                  <Card className="mt-4">
                    <CardContent className="font-sans p-3">
                      <p>PalAI is the proprietary PalMirror AI provider and the default, using OpenRouter to give you access to flagship, openweight models for free. Thanks to <a href="https://hostedon.mochig.com" target="_blank" className="text-blue-300 underline">Mochig</a> for hosting!</p>
                      <div className="flex flex-col gap-1 my-4! p-2 border rounded-lg">
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
                  placeholder={!alreadyEncrypted ? "Setup Secure first" : "Enter API Key"}
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
                <p className="text-xs opacity-50 mb-1">These settings are shared across all profiles.</p>
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
                      <Button className="grow" onClick={() => { setModelInstructions(pmPropSysInst); setInputChangedYet(true); }}>Use P3</Button>
                      <Button variant="outline" size="sm" onClick={() => { setShowPMSysInstSuggestion(false); localStorage.setItem("PMPSIDontShowAgain", "hi everybody") }} >Don&apos;t show again</Button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
            <h2 className="my-4 font-bold">AI generation settings</h2>
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-4">
                <div className="flex row justify-between">
                  <Label>Temperature</Label>
                  <Label className="font-bold">{temperature}</ Label>
                </div>
                <Slider defaultValue={[0.5]} min={0} max={1.5} step={0.01} onValueChange={(val: number[]) => { handleTemperatureChange(val) }} value={[temperature]} />
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex row justify-between">
                  <Label>Reasoning effort</Label>
                  <Label className="font-bold">{reasoningEffortLabels[reasoningEffort]}</ Label>
                </div>
                <Slider defaultValue={[0]} min={0} max={4} step={1} onValueChange={(val: number[]) => { handleReasoningEffortChange(val) }} value={[reasoningEffort]} />
              </div>
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
    </Drawer>
  );
}

export default ChatSettings;