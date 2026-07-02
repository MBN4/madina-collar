import { motion, HTMLMotionProps } from "framer-motion";
import { ReactNode } from "react";
import styles from "./Button.module.css";
import { ANIMATIONS } from "../../styles/theme";

type ButtonProps = Omit<HTMLMotionProps<"button">, "ref"> & {
  variant?: "primary" | "dark" | "ghost";
  fullWidth?: boolean;
  children: ReactNode;
};

export default function Button({
  variant = "primary",
  fullWidth,
  className = "",
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <motion.button
      className={`${styles.btn} ${styles[variant]} ${fullWidth ? styles.full : ""} ${className}`}
      whileHover={disabled ? undefined : { y: -2 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={ANIMATIONS.hover}
      disabled={disabled}
      {...rest}
    >
      {children}
    </motion.button>
  );
}
