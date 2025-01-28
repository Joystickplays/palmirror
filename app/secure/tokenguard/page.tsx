"use client"

import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import SecureBadge from "@/components/SecureBadge"
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

import { useRouter } from 'next/navigation';

export default function Home() {

    const router = useRouter();
    return (
        <div className="grid items-center justify-items-center content-center min-h-screen p-8 pb-20 gap-4 sm:p-20 font-[family-name:var(--font-geist-sans)]">
            <h1 className="scroll-m-20 text-1xl font-extrabold tracking-tight pb-2 flex gap-2 items-center">
                <SecureBadge /> TokenGuard
            </h1>
            <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight lg:text-5xl pb-2 text-center w-4/5">
                Helps you prevent fleeting credits.
            </h1>
            
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
            <ToastContainer
                position="top-right"
                autoClose={5000}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                theme="dark"
            />
        </div>
    );
}
