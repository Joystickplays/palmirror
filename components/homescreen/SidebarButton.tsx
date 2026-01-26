"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ReactNode } from "react";

interface SidebarButtonProps {
	path: string;
	icon: ReactNode;
	isActive?: boolean;
	onClick?: () => void;
}

const buttonVariants = {
	default: {
		initial: { borderRadius: "16px", height: "3.5rem" },
		animate: { backgroundColor: "rgba(255, 255, 255, 0.05)", height: "3.5rem" },
		whileTap: {
			height: "6.5rem",
			borderRadius: "8px",
		},
	},
	primary: {
		initial: { borderRadius: "16px", height: "3.5rem" },
		animate: {
			backgroundColor: "rgba(255, 255, 255, 0.9)",
			color: "rgb(0, 0, 0)",
			height: "6rem",
            borderRadius: "16px",
			scale: 1.05,
		},
		whileTap: {
			height: "6.5rem",
			borderRadius: "8px",
		},
	},
};

export default function SidebarButton({
	path,
	icon,
	isActive = false,
	onClick,
}: SidebarButtonProps) {
	const router = useRouter();
	const variant = isActive ? "primary" : "default";
	const variantConfig = buttonVariants[variant];

	return (
		<motion.button
			initial={variantConfig.initial}
			animate={variantConfig.animate}
			whileTap={variantConfig.whileTap}
            transition={{
                type: "spring",
                stiffness: 300,
                damping: 12,
				backgroundColor: { duration: 0.2 },
				color: { duration: 0.2 },
            }}
            style={{
                // minHeight: variantConfig.initial.height,
            }}
			className="bg-white/5 p-4 rounded-2xl"
			onClick={() => {
				router.push(path);
				onClick && onClick();
			}}
		>
			{icon}
		</motion.button>
	);
}
