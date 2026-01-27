"use client";

import { Input } from "@/components/ui/input"
import { useSidebarStore } from "@/context/zustandStore/Sidebar"
import { motion } from "framer-motion"
import { Search } from "lucide-react"
import React from "react"


export default function DiscoverPage() {

    const isOpen = useSidebarStore(s => s.isOpen)

    return (
        <motion.div
            animate={{
                marginLeft: isOpen ? 100 : 0,
            }} className="flex min-h-screen p-6 gap-4 font-sans!">

            <div className="top-0 left-0 flex fixed justify-end mr-4 p-8 w-full">
                <div className="flex items-center gap-2 p-1 px-4 bg-white/5 border border-white/5 rounded-full">
                    <Search />
                    <Input placeholder="Search" className="focus:ring-0! focus:ring-offset-0! bg-transparent border-0" />
                </div>
            </div>

            <div className="flex flex-col gap-8 mt-22">

                <div className="flex flex-col gap-2">
                    <p className="text-lg font-bold">Must-trys</p>
                    <div className="flex gap-2">
                        {Array.from({ length: 20 }).map((_, idx) => {
                            return (
                                <div
                                style={{
                                    animationDelay: `${idx * 100}ms`
                                }}
                                className="w-64 h-32 bg-white/5 rounded-xl animate-pulse"></div>
                            )
                        })}
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <p className="text-lg font-bold">Popular</p>
                    <div className="flex gap-2">
                        {Array.from({ length: 20 }).map((_, idx) => {
                            return (
                                <div
                                style={{
                                    animationDelay: `${idx * 100}ms`
                                }}
                                className="w-64 h-32 bg-white/5 rounded-xl animate-pulse"></div>
                            )
                        })}
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <p className="text-lg font-bold">These are cool</p>
                    <div className="flex gap-2">
                        {Array.from({ length: 20 }).map((_, idx) => {
                            return (
                                <div
                                style={{
                                    animationDelay: `${idx * 100}ms`
                                }}
                                className="w-45 h-64 bg-white/5 rounded-xl animate-pulse"></div>
                            )
                        })}
                    </div>
                </div>

            </div>

        </motion.div>
    )
}