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





interface ChatCompletionParams {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  stream?: boolean;
  [key: string]: any;
}

async function* requestCompletion(client: OpenAI, params: ChatCompletionParams) {
  const doStream = params.stream !== false;
  if (doStream) {
    const stream = await client.chat.completions.create({
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
    const result = await client.chat.completions.create({
      model: params.model || currentModelName || "gpt-3.5-turbo",
      temperature: params.temperature ?? 0.7,
      stream: false,
      ...params,
    });
    yield result;
  }
}

async function getCascadingChain(): Promise<Array<{ profile: ApiProfile; apiKey: string }> | null> {
  if (typeof window === 'undefined') return null;
  const profilesString = localStorage.getItem('Proxy_profiles');
  if (!profilesString) return null;
  try {
    const profiles: ApiProfile[] = JSON.parse(profilesString);
    const sorted = profiles
      .filter((p) => p.cascade?.working !== false)
      .sort((a, b) => (a.cascade?.priority ?? 999) - (b.cascade?.priority ?? 999));
    if (sorted.length === 0) return null;

    const chain: Array<{ profile: ApiProfile; apiKey: string }> = [];
    for (const profile of sorted) {
      let apiKey = "none";
      if (await isPalMirrorSecureActivated()) {
        try {
          const sessionKey = getActivePLMSecureSession();
          if (sessionKey) {
            const keyData = await getSecureData(`apiKey_${profile.id}`, sessionKey, true);
            const foundApiKey = keyData?.value || keyData || '';
            if (foundApiKey) {
              apiKey = foundApiKey;
            } else if (profile.id === 'default') {
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
      chain.push({ profile, apiKey });
    }
    return chain;
  } catch (e) {
    console.error("Failed to parse Proxy_profiles for cascading:", e);
    return null;
  }
}

export async function* generateChatCompletion(params: ChatCompletionParams) {
  if (!openai) throw new Error("OpenAI client not initialized");

  const cascadingEnabled = typeof window !== 'undefined' ? !!PLMGC.get("cascadingApiProviders") : false;

  if (cascadingEnabled) {
    const chain = await getCascadingChain();
    if (chain && chain.length > 0) {
      let lastError: unknown = null;
      for (let i = 0; i < chain.length; i++) {
        const { profile, apiKey } = chain[i];
        const client = new OpenAI({
          baseURL: profile.baseURL,
          apiKey: apiKey || "none",
          dangerouslyAllowBrowser: true,
          defaultHeaders: {
            "HTTP-Referer": "https://palmirror.vercel.app",
            "X-Title": "PalMirror",
          },
        });
        try {
          yield* requestCompletion(client, params);
          return;
        } catch (err) {
          lastError = err;
          console.error(`Cascading request failed on profile "${profile.name}" (${profile.id}):`, err);
          if (i < chain.length - 1) continue;
        }
      }
      throw lastError;
    }
  }

  yield* requestCompletion(openai, params);
}