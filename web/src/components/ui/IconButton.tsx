import { motion, HTMLMotionProps } from "framer-motion";
import { ReactNode } from "react";
import styles from "./IconButton.module.css";

type IconButtonProps = Omit<HTMLMotionProps<"button">, "ref"> & {
  size?: "md" | "sm";
  children: ReactNode;
};

export default function IconButton({
  size = "md",
  className = "",
  children,
  ...rest
}: IconButtonProps) {
  return (
    <motion.button
      className={`${styles.iconBtn} ${size === "sm" ? styles.sm : ""} ${className}`}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.92 }}
      transition={{ duration: 0.15 }}
      {...rest}
    >
      {children}
    </motion.button>
  );
}
