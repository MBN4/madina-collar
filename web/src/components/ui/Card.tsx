import { HTMLMotionProps, motion } from "framer-motion";
import { ReactNode } from "react";
import styles from "./Card.module.css";

type CardProps = Omit<HTMLMotionProps<"div">, "ref"> & {
  padded?: boolean;
  interactive?: boolean;
  children: ReactNode;
};

export default function Card({
  padded = true,
  interactive = false,
  className = "",
  children,
  ...rest
}: CardProps) {
  return (
    <motion.div
      className={`${styles.card} ${padded ? styles.padded : ""} ${interactive ? styles.interactive : ""} ${className}`}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
