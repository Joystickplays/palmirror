"use client"

import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [alreadyEncrypted, setAlreadyEncrypted] = useState(false);

    const setupPLMSecure = async () => {
        if (password.length < 6) {
            toast.error('Password too short!');
            return;
        }
        if (password !== confirmPassword) {
            toast.error('Passwords do not match!');
            return;
        }

        try {
            await setSecureData('generalSettings', {
                proxy: {
                    api_key: ""
                }
            }, password);
            toast.success('Setup successful!');
            setAlreadyEncrypted(true);
        } catch (error) {
            toast.error('Failed to setup PalMirror Secure...');
            console.log(error)
        }
        setPassword("")
        setConfirmPassword("")
    };

    const removePLMSecure = async () => {
        await indexedDB.deleteDatabase('PalMirrorSecure');
        setAlreadyEncrypted(false);
        toast.success('PalMirror Secure removed successfully!');
    };

    useEffect(() => {
        const checkEncryptionStatus = async () => {
            try {
                const activated = await isPalMirrorSecureActivated();
                setAlreadyEncrypted(activated);
            } catch (error) {
                console.error('Failed to check encryption status:', error);
            }
        };

        checkEncryptionStatus();
        console.log(alreadyEncrypted);
    }, []);

    return (
        <div className="grid items-center justify-items-center content-center min-h-screen p-8 pb-20 gap-4 sm:p-20 font-[family-name:var(--font-geist-sans)]">
            <h1 className="scroll-m-20 text-1xl font-extrabold tracking-tight pb-2">
                PalMirror Secure
            </h1>
            <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight lg:text-5xl pb-2 text-center w-4/5">
                Your chats is yours, and yours only.
            </h1>
            {!alreadyEncrypted && (
                <Dialog>
                    <DialogTrigger asChild>
                        <Button>Setup PalMirror Secure</Button>
                    </DialogTrigger>
                    <DialogContent className="font-sans">
                        <DialogHeader>
                            <DialogTitle>Setup PalMirror Secure</DialogTitle>
                        </DialogHeader>
                        <div className="flex flex-col gap-4">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                type="password"
                                id="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                type="password"
                                id="confirmPassword"
                                placeholder="Confirm your password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                            <DialogClose asChild>
                                <Button onClick={setupPLMSecure}>Encrypt</Button>
                            </DialogClose>
                            <p className="text-sm opacity-70 text-red-500 text-center">PalMirror Secure is NOT recoverable! If you forget the password, your chats will need to be wiped.</p>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
            {alreadyEncrypted && (
                <div className="flex flex-col gap-2">
                    <p className="text-sm">Woo! You&apos;re already using PalMirror Secure.</p>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button>Remove PalMirror Secure</Button>
                        </DialogTrigger>
                        <DialogContent className="font-sans">
                            <DialogHeader>
                                <DialogTitle>Remove PalMirror Secure</DialogTitle>
                            </DialogHeader>
                            <div className="flex flex-col gap-4">
                                <p>By removing PalMirror Secure, lost data will include:</p>
                                <ul className="list-disc pl-5">
                                    <li>Encrypted chats</li>
                                    <li>API Key configuration</li>
                                </ul>
                                <p>Are you sure you want to remove PalMirror Secure? This action cannot be undone. </p>
                                <DialogClose asChild>
                                    <Button variant="destructive" onClick={removePLMSecure}>Confirm Removal</Button>
                                </DialogClose>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            )}
           
            <Accordion type="single" collapsible className="w-full mb-4 mx-4 lg:mx-20">
                <AccordionItem value="item-1">
                    <AccordionTrigger>Why use PalMirror Secure?</AccordionTrigger>
                    <AccordionContent className="flex flex-col gap-2">
                        <p>By using PalMirror Secure, your chats can be securely saved locally on the device with encryption. You no longer have to continuously export and import chats.</p>
                        <ul className="list-disc pl-5">
                            <li className="flex gap-2"><Check /> Local storage of chats</li>
                            <li className="flex gap-2"><Check /> Enhanced privacy with encryption</li>
                            <li className="flex gap-2"><Check /> Requires a password to unlock your chats</li>
                            <li className="flex gap-2"><Check /> Easy setup</li>
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
