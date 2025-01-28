import React, { forwardRef, useState, useEffect } from "react";
import { motion } from 'framer-motion';
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import NumberFlow from '@number-flow/react'

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

interface Step1Props {
    setupPricing: number;
    setupPricingMult: number;
    setSetupPricing: React.Dispatch<React.SetStateAction<number>>;
    setSetupPricingMult: React.Dispatch<React.SetStateAction<number>>;
}
  

const Step1 = forwardRef<HTMLDivElement, Step1Props>(({
    setupPricing,
    setupPricingMult,
    setSetupPricing,
    setSetupPricingMult,
  }, ref) => {

    const [conversationTotalCost, setConversationTotalCost] = useState(0);

    const handleInputChangePricing = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSetupPricing(parseFloat(value));
    };

    const handleInputChangePricingMult = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSetupPricingMult(parseFloat(value));
    };

    useEffect(() => {
        if (setupPricing > 0 && setupPricingMult > 0) {
            let totalCost = 0;
            for (let i = 1; i <= 75; i++) {
                const tokens = i * 267;
                const cost = (tokens / setupPricingMult) * setupPricing;
                totalCost += cost;
            }
            setConversationTotalCost(totalCost);
        }
    }, [setupPricing, setupPricingMult]);
    
    return (
        <div
            ref={ref}
            className="flex gap-2 flex-col">
            <h1 className="text-3xl font-extrabold tracking-tight pb-2">Model pricing</h1>
            <hr />
            <p>How much is your AI provider charging for tokens?</p>
            <div className="flex gap-2 items-center justify-start">
                <p>$</p>
                <Input placeholder="0.01" type="number" min="0" value={setupPricing} onChange={handleInputChangePricing}/>
                <p>per</p>
                <Input placeholder="1,000,000" type="number" min="0" value={setupPricingMult} onChange={handleInputChangePricingMult}/>
                <p>tokens</p>
            </div>
            <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setSetupPricingMult((isNaN(setupPricingMult) ? 0 : setupPricingMult) + 1000)}>+1K</Button>
                <Button variant="outline" size="sm" onClick={() => setSetupPricingMult((isNaN(setupPricingMult) ? 0 : setupPricingMult) + 1000000)}>+1M</Button>
            </div>
            <div className="border rounded-lg p-4 flex flex-col gap-2">
                <h1 className="text-lg font-bold">Cost predictions</h1>
                <p className="text-sm opacity-50">One lengthy 20,025-tokens conversation based on your pricing configuration can roughly cost up to:</p>
                <p className="text-2xl font-extrabold"><NumberFlow
                    value={conversationTotalCost}
                    format={{ style: 'decimal'}}
                    prefix="$"
                /></p>
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                        <AccordionTrigger>How is this calculated?</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-2">
                            <p>This rough estimation is calculated by adding the cost between 75 batches of 267 tokens.</p>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
        </div>
    )
});

export default Step1;
