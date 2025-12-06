import OpenAI from "openai";
import { isPalMirrorSecureActivated, getSecureData, PLMSecureGeneralSettings } from './palMirrorSecureUtils';
import { getActivePLMSecureSession } from './palMirrorSecureSession';


export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  name?: string;
}


let openai: OpenAI | null = null;

export function initializeOpenAI(baseURL: string, apiKey: string) {
    if (openai) { return openai };

    openai = new OpenAI({
        baseURL,
        apiKey,
        dangerouslyAllowBrowser: true,
    });
}

export async function independentInitOpenAI() {
    if (openai) { 
      if (openai.apiKey !== "none") {
        return openai;
      }
     };
    let baseURL = "https://cvai.mhi.im/v1";
    let apiKey = "none";

    if (typeof window !== 'undefined') {
        const settings = localStorage.getItem("Proxy_settings");
        if (settings) {
            const parsedSettings = JSON.parse(settings);
            baseURL = parsedSettings.baseURL || "https://cvai.mhi.im/v1";
        }

        if (await isPalMirrorSecureActivated()) {
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
      model: params.model || "gpt-3.5-turbo",
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
      model: params.model || "gpt-3.5-turbo",
      temperature: params.temperature ?? 0.7,
      stream: false,
      ...params,
    });
    yield result;
  }
}