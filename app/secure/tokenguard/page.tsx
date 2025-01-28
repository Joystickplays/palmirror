"use client"

import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import SecureBadge from "@/components/SecureBadge"
import Step1 from "@/components/tokenGuardSetupSteps/Step1"
import Step2 from "@/components/tokenGuardSetupSteps/Step2"
import { ToastContainer, toast } from 'react-toastify';
import { Check } from 'lucide-react';
import 'react-toastify/dist/ReactToastify.css';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog"

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

import { setSecureData, removeSecureData, isPalMirrorSecureActivated } from '@/utils/palMirrorSecureUtils';
import { AnimatePresence, motion } from 'framer-motion';
import NumberFlow, { NumberFlowGroup } from '@number-flow/react'

import { useRouter } from 'next/navigation';
const MotionButton = motion(Button);

const MotionStep1 = motion(Step1)
const MotionStep2 = motion(Step2)

export default function TokenGuard() {

    
    const router = useRouter();
    const [isSecureActivated, setIsSecureActivated] = useState(false);

    useEffect(() => {
        const checkSecureActivation = async () => {
            const activated = await isPalMirrorSecureActivated();
            setIsSecureActivated(activated);
        };
        checkSecureActivation();
    }, []);
    const [demoTokens, setDemoTokens] = useState(0);
    const [demoTokenPricing, setDemoTokenPricing] = useState(0);
    const [demoPricingPer, setDemoPricingPer] = useState("K" as "K" | "M");
    const [demoTotalCost, setDemoTotalCost] = useState(0);

    const [setupPricing, setSetupPricing] = useState(0.01);
    const [setupPricingMult, setSetupPricingMult] = useState(1000);
    const [setupBudgetLimit, setSetupBudgetLimit] = useState(1);
    const [setupInitialCredits, setSetupInitialCredits] = useState(30);

    const [ongoingSetup, setOngoingSetup] = useState(false);
    const [setupStep, setSetupStep] = useState(1);


    useEffect(() => {
        const interval = setInterval(() => {
            const newDemoTokens = Math.floor(Math.random() * (100000 - 100 + 1)) + 100;
            const newDemoTokenPricing = parseFloat((Math.random() * (1 - 0.002) + 0.002).toFixed(5));
            const newDemoPricingPer = Math.random() < 0.5 ? "K" : "M";
            const multiplier = newDemoPricingPer === "K" ? 1000 : 1000000;
            const newDemoTotalCost = newDemoTokens * newDemoTokenPricing / multiplier;

            setDemoTokens(newDemoTokens);
            setDemoTokenPricing(newDemoTokenPricing);
            setDemoPricingPer(newDemoPricingPer);
            setDemoTotalCost(newDemoTotalCost);
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    

    return (
        <AnimatePresence mode="popLayout">
            {!ongoingSetup ? (
                <motion.div key="setupLandingPage" className="grid items-center justify-items-center content-center min-h-screen p-8 pb-20 gap-4 sm:p-20 font-[family-name:var(--font-geist-sans)]"
                    exit={{ scale: 0, opacity: 0, y: -200 }}
                    transition={{ type: "spring", stiffness: 215, damping: 30 }}>
                    <h1 className="scroll-m-20 text-1xl font-extrabold tracking-tight pb-2 flex gap-2 items-center">
                        <SecureBadge /> TokenGuard
                    </h1>
                    <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight lg:text-5xl pb-2 text-center w-4/5">
                        Helps you prevent fleeting credits.
                    </h1>
                    <motion.div layout className="border p-4 rounded-lg">
                        <p className="font-mono">
                            <NumberFlowGroup>
                                <NumberFlow value={demoTokens} /> tokens
                                <span className="mx-2 md:mx-4 opacity-50">/</span>
                                <NumberFlow
                                    value={demoTokenPricing}
                                    format={{ style: 'currency', currency: 'USD' }}
                                    suffix={`/${demoPricingPer}`}
                                />
                                <span className="mx-2 md:mx-4 opacity-50">/</span>
                                <NumberFlow
                                    value={demoTotalCost}
                                    format={{ style: 'currency', currency: 'USD' }}
                                    suffix={" used"}
                                />
                            </NumberFlowGroup>

                        </p>
                    </motion.div>

                    <Button className="w-64 max-w-screen" disabled={!isSecureActivated} onClick={() => setOngoingSetup(true)}>Setup</Button>
                    {!isSecureActivated && (
                        <div className="flex gap-2 items-center">
                            <p>TokenGuard requires PalMirror Secure. </p>
                            <Button onClick={() => router.push("/secure")}>Setup PalMirror Secure</Button>
                        </div>
                    )}

                    <Accordion type="single" collapsible className="w-full mb-4 mx-4 lg:mx-20">
                        <AccordionItem value="item-1">
                            <AccordionTrigger>What does it do?</AccordionTrigger>
                            <AccordionContent className="flex flex-col gap-2">
                                <p>TokenGuard can notify you about any potential credit overcharge from excessive token use.</p>
                                <ul className="list-disc pl-5">
                                    <li className="flex gap-2"><Check /> Realtime token counter on chats</li>
                                    <li className="flex gap-2"><Check /> Cost accumulation statistic</li>
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </motion.div>
            ) : (
                <motion.div key="setupPage" className="flex flex-col items-center justify-items-center min-h-screen p-4 w-full gap-4 sm:p-8 font-[family-name:var(--font-geist-sans)] overflow-x-hidden"
                    initial={{ scale: 0.7, opacity: 0, y: 500 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 215, damping: 30 }}>
                    <h1 className="scroll-m-20 text-1xl font-extrabold tracking-tight pb-2 flex gap-2 items-center">
                        TokenGuard Setup
                    </h1>
                    <div className="text-start w-full max-w-[40rem] overflow-x-hidden">
                        <p className="text-sm opacity-50">Step <NumberFlow value={setupStep} /></p>
                        <AnimatePresence mode="popLayout">
                        {setupStep === 1 ? (
                            <MotionStep1
                            initial={{ x: -300, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 300, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 215, damping: 30 }}
                            setupPricing={setupPricing} setupPricingMult={setupPricingMult} setSetupPricing={setSetupPricing} setSetupPricingMult={setSetupPricingMult} key="setupStep1" />
                        ) : (setupStep === 2 ? (
                            <MotionStep2
                            initial={{ x: -300, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 300, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 215, damping: 30 }}
                            setupBudgetLimit={setupBudgetLimit} setSetupBudgetLimit={setSetupBudgetLimit} setupInitialCredits={setupInitialCredits} setSetupInitialCredits={setSetupInitialCredits} />
                        ) : (
                            <p>idk</p>
                        ))}
                        </AnimatePresence>
                        
                    </div>
                    <motion.div layout className="flex gap-2 justify-end w-full">
                        <AnimatePresence>
                            {setupStep > 1 && (
                                <MotionButton key="prevStep" onClick={() => setSetupStep(setupStep - 1)} variant="outline"
                                initial={{ x: 50, opacity: 0, scale: 0 }}
                                animate={{ x: 0, opacity: 1, scale: 1 }}
                                exit={{ x: 50, opacity: 0, scale: 0 }}
                                transition={{ type: "spring", stiffness: 215, damping: 30 }}>
                                Previous</MotionButton>
                            )}
                            <Button key="nextStep" onClick={() => setSetupStep(setupStep + 1)}>Next</Button>
                        </AnimatePresence>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
