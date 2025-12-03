"use client";

import { useState, useEffect } from "react";
import { DomainAttributeEntry } from "@/types/EEDomain";

import NumberFlow, { continuous } from "@number-flow/react";
import { Progress } from "./ui/progress";


type AttributeProgressProps = {
  attr: DomainAttributeEntry;
  animated?: boolean;
};

const AttributeProgress: React.FC<AttributeProgressProps> = ({ attr, animated = true }) => {
  const [progressValue, setProgressValue] = useState(0);

  useEffect(() => {
    const id = requestAnimationFrame(() => setProgressValue(attr.value));
    return () => cancelAnimationFrame(id);
  }, [attr.value]);

  return (
    <div className="flex flex-col gap-2 min-w-32 font-sans">
      <div className="flex justify-between items-end">
        <p className="text-sm font-bold">{attr.attribute}</p>
        <p className="opacity-25 text-xs">
          <NumberFlow animated={animated} plugins={[continuous]} value={progressValue} />%
        </p>
      </div>
      <Progress innerClassName={`${!animated ? "duration-0!" : "duration-1000"}`} className={`h-3!`} value={progressValue} max={100} />
    </div>
  );
}

export default AttributeProgress;