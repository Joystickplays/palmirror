import { usePLMGlobalConfig } from "@/context/PLMGlobalConfig";

export default function DeveloperOnly({ children }: { children: React.ReactNode }) {
    const PLMGC = usePLMGlobalConfig();
    if (!PLMGC.get("developerMode")) return null;

    return (
        <>
            {children}
        </>
    );
}