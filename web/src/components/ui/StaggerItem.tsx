import { motion } from "framer-motion";
import { ReactNode } from "react";

type StaggerItemProps = {
  index?: number;
  staggerMs?: number;
  direction?: "up" | "down" | "right" | "scale";
  children: ReactNode;
  className?: string;
};

// Replicates mobile's per-item entrance animations (QualityScreen fade+slide+scale stagger,
// SizeSelectionScreen FadeInDown/FadeInRight) using a shared spring curve.
export default function StaggerItem({
  index = 0,
  staggerMs = 150,
  direction = "up",
  children,
  className,
}: StaggerItemProps) {
  const offset =
    direction === "up" ? { y: 30 } : direction === "down" ? { y: -30 } : direction === "right" ? { x: 30 } : {};
  const scale = direction === "scale" ? 0.95 : 1;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale, ...offset }}
      animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 110,
        damping: 14,
        delay: (index * staggerMs) / 1000,
      }}
    >
      {children}
    </motion.div>
  );
}
