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
		backgroundColor: "rgba(255, 255, 255, 0.05)",
		color: "rgb(255, 255, 255)",
		height: "3.5rem",
		borderRadius: "16px",
		scale: 1,
	},
	primary: {
		backgroundColor: "rgba(255, 255, 255, 0.9)",
		color: "rgb(0, 0, 0)",
		height: "6rem",
		borderRadius: "16px",
		scale: 1.05,
	},
	tap: {
		height: "6.5rem",
		borderRadius: "8px",
	}
};

export default function SidebarButton({
	path,
	icon,
	isActive = false,
	onClick,
}: SidebarButtonProps) {
	const router = useRouter();
	
	const currentVariant = isActive ? "primary" : "default";

	return (
		<motion.button
			initial={false}
			animate={currentVariant}
			whileTap="tap"
			variants={buttonVariants}
			transition={{
				type: "spring",
				stiffness: 300,
				damping: 12,
				backgroundColor: { duration: 0.2 },
				color: { duration: 0.2 },
			}}
			className="p-4 flex items-center justify-center outline-none border-none cursor-pointer"
			style={{
				width: "100%",
				display: "flex"
			}}
			onClick={() => {
				router.push(path);
				if (onClick) onClick();
			}}
		>
			{icon}
		</motion.button>
	);
}