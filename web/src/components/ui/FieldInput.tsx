import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { ReactNode, useState } from "react";
import styles from "./FieldInput.module.css";

type FieldInputProps = {
  icon?: ReactNode;
  isPassword?: boolean;
  isOtp?: boolean;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

export function FieldInput({
  icon,
  isPassword,
  isOtp,
  className = "",
  ...rest
}: FieldInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={`${styles.wrapper} ${className}`}>
      {icon ? <span className={styles.icon}>{icon}</span> : null}
      <input
        className={`${styles.input} ${isOtp ? styles.otp : ""}`}
        type={isPassword && !visible ? "password" : isOtp ? "text" : rest.type || "text"}
        {...rest}
      />
      {isPassword ? (
        <button
          type="button"
          className={styles.eyeBtn}
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={visible ? "on" : "off"}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.1 }}
              style={{ display: "inline-flex" }}
            >
              {visible ? <EyeOff size={22} /> : <Eye size={22} />}
            </motion.span>
          </AnimatePresence>
        </button>
      ) : null}
    </div>
  );
}

type FieldTextareaProps = {
  icon?: ReactNode;
  className?: string;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function FieldTextarea({ icon, className = "", ...rest }: FieldTextareaProps) {
  return (
    <div className={`${styles.textareaWrapper} ${className}`}>
      {icon ? <span className={styles.icon}>{icon}</span> : null}
      <textarea className={styles.textarea} {...rest} />
    </div>
  );
}
