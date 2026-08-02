"use client";

import { useEffect, useState } from "react";

const cache = new Map<string, string>();

export function colorFromName(name: string): string {
    const key = `name:${name}`;
    if (cache.has(key)) return cache.get(key)!;

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
    }

    const hue = hash % 360;
    const color = `hsl(${hue}, 70%, 62%)`;
    cache.set(key, color);
    return color;
}

export function extractAccentColorFromImage(src: string): Promise<string | null> {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
            try {
                const canvas = document.createElement("canvas");
                const size = 48;
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext("2d");
                if (!ctx) return resolve(null);

                ctx.drawImage(img, 0, 0, size, size);
                const { data } = ctx.getImageData(0, 0, size, size);

                let bestScore = -1;
                let best: [number, number, number] = [128, 128, 128];

                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];
                    const a = data[i + 3];
                    if (a < 128) continue;

                    const max = Math.max(r, g, b);
                    const min = Math.min(r, g, b);
                    const sat = max === 0 ? 0 : (max - min) / max;
                    const bright = (r + g + b) / 3;

                    if (sat < 0.15 || bright < 40 || bright > 225) continue;

                    const score = sat * 100 + (bright / 255) * 20;
                    if (score > bestScore) {
                        bestScore = score;
                        best = [r, g, b];
                    }
                }

                resolve(`rgb(${best[0]}, ${best[1]}, ${best[2]})`);
            } catch {
                resolve(null);
            }
        };
        img.onerror = () => resolve(null);
        img.src = src;
    });
}

export async function getCharacterAccentColor(name: string, image?: string): Promise<string> {
    const key = `resolved:${name}`;
    if (cache.has(key)) return cache.get(key)!;

    const fallback = colorFromName(name);

    if (image) {
        const extracted = await extractAccentColorFromImage(image);
        if (extracted) {
            cache.set(key, extracted);
            return extracted;
        }
    }

    cache.set(key, fallback);
    return fallback;
}

export function useCharacterColor(name: string, image?: string): string {
    const [color, setColor] = useState(() => colorFromName(name));

    useEffect(() => {
        let cancelled = false;
        getCharacterAccentColor(name, image).then((resolved) => {
            if (!cancelled) setColor(resolved);
        });
        return () => {
            cancelled = true;
        };
    }, [name, image]);

    return color;
}
