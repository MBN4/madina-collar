import { ReactNode } from "react";
import styles from "./Badge.module.css";

type BadgeProps = {
  variant?: "solid" | "outline" | "surface";
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
};

export default function Badge({ variant = "solid", icon, children, className = "" }: BadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[variant]} ${className}`}>
      {icon}
      {children}
    </span>
  );
}
