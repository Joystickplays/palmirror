import OpenAI from "openai";
import { isPalMirrorSecureActivated, getSecureData, PLMSecureGeneralSettings } from './palMirrorSecureUtils';
import { getActivePLMSecureSession } from './palMirrorSecureSession';
import { PLMGlobalConfigServiceInstance as PLMGC } from "@/context/PLMGlobalConfigService";
import { ApiProfile } from "@/types/ApiProfile";


export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  name?: string;
}


let openai: OpenAI | null = null;
let currentModelName: string | null = null;

export function initializeOpenAI(baseURL: string, apiKey: string) {
    if (openai) { return openai };

    openai = new OpenAI({
        baseURL,
        apiKey,
        dangerouslyAllowBrowser: true,
    });
}

export async function independentInitOpenAI() {
    const cascadingEnabled = typeof window !== 'undefined' ? !!PLMGC.get("cascadingApiProviders") : false;

    if (openai && !cascadingEnabled) { 
      if (openai.apiKey !== "none") {
        return openai;
      }
     };
    let baseURL = "https://cvai.mhi.im/v1";
    let apiKey = "none";
    let modelName = "gpt-3.5-turbo";

    if (typeof window !== 'undefined') {
        const settings = localStorage.getItem("Proxy_settings");
        if (settings) {
            const parsedSettings = JSON.parse(settings);
            baseURL = parsedSettings.baseURL || "https://cvai.mhi.im/v1";
            modelName = parsedSettings.modelName || "gpt-3.5-turbo";
        }

        const cascadingEnabled = PLMGC.get("cascadingApiProviders");
        if (cascadingEnabled) {
            const profilesString = localStorage.getItem('Proxy_profiles');
            if (profilesString) {
                try {
                    const profiles: ApiProfile[] = JSON.parse(profilesString);
                    const activeProfile = profiles
                        .filter((p) => p.cascade?.working !== false)
                        .sort((a, b) => (a.cascade?.priority ?? 999) - (b.cascade?.priority ?? 999))[0];

                    if (activeProfile) {
                        baseURL = activeProfile.baseURL;
                        modelName = activeProfile.modelName;

                        if (await isPalMirrorSecureActivated()) {
                            try {
                                const sessionKey = getActivePLMSecureSession();
                                if (sessionKey) {
                                    const keyData = await getSecureData(`apiKey_${activeProfile.id}`, sessionKey, true);
                                    const foundApiKey = keyData?.value || keyData || '';

                                    if (foundApiKey) {
                                        apiKey = foundApiKey;
                                    } else if (activeProfile.id === 'default') {
                                        const proxySettings = (await getSecureData(
                                            "generalSettings",
                                            sessionKey,
                                            true
                                        )) as PLMSecureGeneralSettings;
                                        if (proxySettings.proxy && proxySettings.proxy.api_key) {
                                            apiKey = proxySettings.proxy.api_key;
                                        }
                                    }
                                }
                            } catch (error) {
                                console.error("Failed to get cascading secure settings:", error);
                            }
                        }
                    }
                } catch (e) {
                    console.error("Failed to parse Proxy_profiles for cascading:", e);
                }
            }
        } else if (await isPalMirrorSecureActivated()) {
            try {
                const sessionKey = getActivePLMSecureSession();
                if (sessionKey) {
                    const proxySettings = (await getSecureData(
                        "generalSettings",
                        sessionKey,
                        true
                    )) as PLMSecureGeneralSettings;
                    if (proxySettings.proxy && proxySettings.proxy.api_key) {
                        apiKey = proxySettings.proxy.api_key;
                        console.log("done")
                    }
                }
            } catch (error) {
                console.error("Failed to get secure settings for independent OpenAI init:", error);
            }
        }
    }

    currentModelName = modelName;
    openai = new OpenAI({
        baseURL: baseURL,
        apiKey: apiKey,
        dangerouslyAllowBrowser: true,
    });
}





export async function* generateChatCompletion(params: {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  stream?: boolean;
  [key: string]: any;
}) {
  if (!openai) throw new Error("OpenAI client not initialized");
  const doStream = params.stream !== false;
  if (doStream) {
    const stream = await openai.chat.completions.create({
      model: params.model || currentModelName || "gpt-3.5-turbo",
      temperature: params.temperature ?? 0.7,
      stream: true,
      ...params,
    });
    if (stream && typeof (stream as any)[Symbol.asyncIterator] === "function") {
      for await (const chunk of stream as AsyncIterable<any>) {
        yield chunk;
      }
    } else {
      yield stream;
    }
  } else {
    const result = await openai.chat.completions.create({
      model: params.model || currentModelName || "gpt-3.5-turbo",
      temperature: params.temperature ?? 0.7,
      stream: false,
      ...params,
    });
    yield result;
  }
}