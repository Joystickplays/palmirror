import React from "react";

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"


const SecureBadge = () => {
  return (
    
    <HoverCard>
      <HoverCardTrigger asChild>
        <div className="p-2 py-1 border rounded-lg select-none">
          <p className="p-0 m-0 bg-gradient-to-r from-neutral-400 to-neutral-700 text-transparent bg-clip-text">Secure</p>    
        </div>
      </HoverCardTrigger>
      <HoverCardContent>
        This requires PalMirror Secure to use.
      </HoverCardContent>
    </HoverCard>

  );
};
export default SecureBadge;
