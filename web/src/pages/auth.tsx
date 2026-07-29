import { AnimatePresence, motion } from "framer-motion";
import { Lock, Phone, User } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import Button from "../components/ui/Button";
import { FieldInput } from "../components/ui/FieldInput";
import { useAuthStore } from "../store/authStore";
import styles from "../styles/Auth.module.css";
import api from "../utils/api";

const MARQUEE_LOGOS = [
  "/images/anarkali.jpg",
  "/images/angle.jpg",
  "/images/madina-collar.jpg",
  "/images/new-madina-collar.png",
  "/images/pak.jpg",
];

function MarqueeRow({
  duration,
  reverse,
}: {
  duration: number;
  reverse?: boolean;
}) {
  const items = [
    ...MARQUEE_LOGOS,
    ...MARQUEE_LOGOS,
    ...MARQUEE_LOGOS,
    ...MARQUEE_LOGOS,
  ];
  return (
    <motion.div
      className={styles.marqueeRow}
      animate={{ x: reverse ? ["-50%", "0%"] : ["0%", "-50%"] }}
      transition={{ duration, ease: "linear", repeat: Infinity }}
    >
      {items.map((src, index) => (
        <motion.div
          key={index}
          className={`${styles.marqueeItem} ${index % 2 === 0 ? styles.offset : styles.unoffset}`}
          animate={{ y: [10, -10] }}
          transition={{
            duration: 2.5 + (index % 3) * 0.4,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "mirror",
          }}
        >
          <div className={styles.logoPod}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" />
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}

const Auth = () => {
  const router = useRouter();
  const { isAuthenticated, setAuth, checkAuth } = useAuthStore();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/catalog");
    }
  }, [isAuthenticated, router]);

  const setMsg = (text: string, error = false) => {
    setMessage(text);
    setIsError(error);
  };

  const handleSignupFlow = async () => {
    setMsg("");
    if (!username || !phone || !password || !confirmPassword)
      return setMsg("Please enter all details", true);
    if (phone.length !== 11)
      return setMsg("Phone number must be exactly 11 digits", true);
    if (password !== confirmPassword)
      return setMsg("Passwords do not match", true);
    setLoading(true);
    try {
      await api.post("/auth/register", { username, phone, password });
      setMsg("Registration complete! Please sign in.");
      setIsLogin(true);
      setUsername("");
      setPhone("");
      setPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setMsg(err.response?.data?.msg || "Something went wrong", true);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!phone || !password) return setMsg("All fields are required", true);
    if (phone.length !== 11)
      return setMsg("Phone number must be exactly 11 digits", true);
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { phone, password });
      setAuth(res.data.user, res.data.token);
      router.replace("/catalog");
    } catch (err: any) {
      setMsg(err.response?.data?.msg || "Invalid credentials", true);
    } finally {
      setLoading(false);
    }
  };

  const authTitle = useMemo(
    () => (isLogin ? "Authentic Choice" : "Join the Elite"),
    [isLogin],
  );

  const authSubtitle = useMemo(
    () =>
      isLogin
        ? "Sign in to continue your journey."
        : "Create your account to get started.",
    [isLogin],
  );

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${isLogin}`}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 14 }}
          >
            <div className={styles.header}>
              <motion.div
                className={styles.logoContainer}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 140, damping: 12 }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/madina-collar-round.png"
                  alt="Madina Collar"
                />
              </motion.div>
              <h1 className={styles.title}>{authTitle}</h1>
              <p className={styles.subtitle}>{authSubtitle}</p>
            </div>

            <div className={styles.form}>
              {isLogin ? (
                <>
                  <FieldInput
                    icon={<Phone size={20} />}
                    placeholder="Phone Number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    maxLength={11}
                    inputMode="numeric"
                  />
                  <FieldInput
                    icon={<Lock size={20} />}
                    isPassword
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Button fullWidth onClick={handleLogin} disabled={loading}>
                    {loading ? "Signing In..." : "Sign In"}
                  </Button>
                </>
              ) : (
                <>
                  <FieldInput
                    icon={<User size={20} />}
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                  <FieldInput
                    icon={<Phone size={20} />}
                    placeholder="Phone Number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    maxLength={11}
                    inputMode="numeric"
                  />
                  <FieldInput
                    icon={<Lock size={20} />}
                    isPassword
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <FieldInput
                    icon={<Lock size={20} />}
                    isPassword
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <Button
                    fullWidth
                    onClick={handleSignupFlow}
                    disabled={loading}
                  >
                    {loading ? "Processing..." : "Register"}
                  </Button>
                </>
              )}

              {message && (
                <div
                  className={`${styles.message} ${isError ? styles.messageError : ""}`}
                >
                  {message}
                </div>
              )}

              <div className={styles.switchRow}>
                <span>
                  {isLogin
                    ? "Don't have an account?"
                    : "Already have an account?"}
                </span>
                <button
                  type="button"
                  className={styles.switchBtn}
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setMsg("");
                  }}
                >
                  {isLogin ? "Sign Up" : "Sign In"}
                </button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Auth;
