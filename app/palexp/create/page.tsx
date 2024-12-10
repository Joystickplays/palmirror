"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  return (
    <div className="flex flex-col justify-content-center min-h-screen p-8 gap-4 font-[family-name:var(--font-geist-sans)]">
      <div className="flex justify-around items-center w-full !h-fit">
      <h1 className="scroll-m-20 text-2xl font-extrabold tracking-tight  pb-2 palmirror-exc-text w-full sm:w-auto text-center">
        PalMirror Experience
      </h1>
        <Button variant="outline" className="hidden sm:block" onClick={() => {router.push('/')}}>Back</Button>
        </div>
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight my-10  w-auto text-center">
        <i>Your</i> character, <span className="palmirror-exc-text">supercharged.</span>
      </h1>
        <div className="px-2 lg:px-48 flex flex-col gap-1">
            <p>Character picture</p>
            <Input id="picture" type="file" accept=".png" />
        </div>
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
