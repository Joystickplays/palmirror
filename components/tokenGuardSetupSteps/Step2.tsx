import React from "react";
import { forwardRef } from "react";
import { motion } from 'framer-motion';
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface Step2Props {
    setupBudgetLimit: number;
    setupInitialCredits: number;
    setSetupBudgetLimit: React.Dispatch<React.SetStateAction<number>>;
    setSetupInitialCredits: React.Dispatch<React.SetStateAction<number>>;
}


const Step2 = forwardRef<HTMLDivElement, Step2Props>(({
    setupBudgetLimit,
    setupInitialCredits,
    setSetupBudgetLimit,
    setSetupInitialCredits,
}, ref) => {

    const handleInputChangeBudgetLimit = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSetupBudgetLimit(parseFloat(value));
    };

    const handleInputChangeInitialCredits = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSetupInitialCredits(parseFloat(value));
    };

    return (
        <div
            ref={ref}
            className="flex gap-2 flex-col">
            <h1 className="text-3xl font-extrabold tracking-tight pb-2">Budget configuration</h1>
            <hr />
            <p>What's the budget?</p>
            <div className="flex flex-col gap-1">
                <div className="flex gap-2 items-center justify-start">
                    <p>$</p>
                    <Input placeholder="1" type="number" min="0" value={setupBudgetLimit} onChange={handleInputChangeBudgetLimit} />
                    
                </div>
                <p className="text-xs opacity-50">TokenGuard will warn you if you're nearing this limit.</p>
            </div>
            <p>How many credits do you currently have?</p>
            <div className="flex flex-col gap-1">
                <div className="flex gap-2 items-center justify-start">
                    <p>$</p>
                    <Input placeholder="10" type="number" min="0" value={setupInitialCredits} onChange={handleInputChangeInitialCredits} />
                    
                </div>
            </div>
        </div>
    )
});

export default Step2;
