"use client";

import Dexie from 'dexie';
import 'dexie-export-import'; 
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export async function saveCheckpoint(extraMetadata: Record<string, any> = {}) {
    try {
        const zip = new JSZip();
        const now = new Date().toISOString();

        zip.file("metadata.json", JSON.stringify({
            exportedAt: now,
            ...extraMetadata
        }, null, 2));

        zip.file("localStorage.json", JSON.stringify({ ...localStorage }, null, 2));

        
        const dbs = await (window.indexedDB as any).databases?.() || [];
        for (const dbInfo of dbs) {
            const dbName = dbInfo.name;
            if (!dbName) continue; 
            try {
                const db = new Dexie(dbName);
                await db.open();
                
                const blob = await db.export({ prettyJson: true });
                zip.file(`indexedDB/${dbName}.json`, blob);
                db.close();
            } catch (e: any) { 
                console.error(`Export failed: ${dbName}`, e);
                zip.file(`indexedDB/${dbName}_ERROR.txt`, e?.toString() || "Unknown Error");
            }
        }

        const content = await zip.generateAsync({ type: "blob" });
        const fileName = `${extraMetadata.checkpointName || location.hostname}_checkpoint_${now.slice(0, 10)}.pmchk`
        saveAs(content, fileName);
    } catch (err) {
        console.error("Export Error:", err);
    }
}

export async function extractMetadata(zipFile: File | Blob) { 
    try {
        const zip = await JSZip.loadAsync(zipFile);
        const metaFile = zip.file("metadata.json");
        if (!metaFile) return null;
        return JSON.parse(await metaFile.async("string"));
    } catch (err) {
        console.error("Metadata Extraction Error:", err);
        return null;
    }
}

export async function loadCheckpoint() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.zip';
    input.style.display = 'none';
    document.body.appendChild(input);

    input.onchange = async (e: Event) => {
        
        const target = e.target as HTMLInputElement;
        const file = target?.files?.[0];
        if (input.parentNode) document.body.removeChild(input);
        if (!file) return;

        try {
            const zip = await JSZip.loadAsync(file);

            const lsFile = zip.file("localStorage.json");
            if (lsFile) {
                const lsData = JSON.parse(await lsFile.async("string"));
                localStorage.clear();
                Object.entries(lsData).forEach(([k, v]) => localStorage.setItem(k, v as string));
            }

            const dbFiles = Object.keys(zip.files).filter(f => f.startsWith("indexedDB/") && f.endsWith(".json"));
            for (const filename of dbFiles) {
                const dbName = filename.split('/').pop()?.replace('.json', '');
                if (!dbName) continue;

                const fileData = zip.file(filename);
                if (!fileData) continue; 

                const jsonStr = await fileData.async("string");
                const blob = new Blob([jsonStr], { type: "application/json" });
                
                await Dexie.delete(dbName);
                await Dexie.import(blob);
            }

            location.reload();
        } catch (err) {
            console.error("Import Error:", err);
        }
    };

    input.click();
}