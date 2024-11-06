import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"


export default function Home() {
  return (
    <div className="grid items-center justify-items-center content-center min-h-screen p-8 pb-20 gap-12 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
        PalMirror
      </h1>

      <div className="flex flex-row gap-6">
        <Input placeholder="JanitorAI character link" />
        <Button>Start</Button>  
      </div>
    </div>
  );
}
