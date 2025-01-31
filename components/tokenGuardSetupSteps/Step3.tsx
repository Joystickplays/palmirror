import React from "react";
import { forwardRef } from "react";
import { motion } from 'framer-motion';
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface Step3Props {
}


const Step3 = forwardRef<HTMLDivElement, Step3Props>(({
}, ref) => {
    return (
        <div
            ref={ref}
            className="flex gap-2 flex-col">
            <h1 className="text-3xl font-extrabold tracking-tight pb-2">All done!</h1>
            <hr />
            <p>You can change these settings on this same page.</p>
        </div>
    )
});

Step3.displayName = "Step3"
export default Step3;
