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
  const [signupStep, setSignupStep] = useState(1);
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [timer, setTimer] = useState(60);
  const [isTimerActive, setIsTimerActive] = useState(false);
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

  useEffect(() => {
    let interval: number | undefined;
    if (isTimerActive && timer > 0) {
      interval = window.setInterval(() => setTimer((t) => t - 1), 1000);
    } else if (timer === 0) {
      setIsTimerActive(false);
      window.clearInterval(interval);
    }
    return () => window.clearInterval(interval);
  }, [isTimerActive, timer]);

  const setMsg = (text: string, error = false) => {
    setMessage(text);
    setIsError(error);
  };

  const handleSignupFlow = async () => {
    setMsg("");
    if (signupStep === 1) {
      if (!username || !phone) return setMsg("Please enter all details", true);
      if (phone.length !== 11)
        return setMsg("Phone number must be exactly 11 digits", true);
      setLoading(true);
      try {
        await api.post("/auth/register/step1", { username, phone });
        setSignupStep(2);
        setTimer(60);
        setIsTimerActive(true);
        setMsg("OTP sent to WhatsApp");
      } catch (err: any) {
        setMsg(err.response?.data?.msg || "Something went wrong", true);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (signupStep === 2) {
      if (otp.length < 4) return setMsg("Enter valid OTP", true);
      setLoading(true);
      try {
        await api.post("/auth/register/step2", { phone, otp });
        setSignupStep(3);
        setIsTimerActive(false);
        setMsg("OTP verified successfully");
      } catch (err: any) {
        setMsg(err.response?.data?.msg || "Something went wrong", true);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (password !== confirmPassword)
      return setMsg("Passwords do not match", true);
    setLoading(true);
    try {
      await api.post("/auth/register/step3", { username, phone, password });
      setMsg("Registration complete! Please sign in.");
      setIsLogin(true);
      setSignupStep(1);
      setUsername("");
      setPhone("");
      setOtp("");
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

  const authTitle = useMemo(() => {
    if (isLogin) return "Authentic Choice";
    if (signupStep === 1) return "Join the Elite";
    if (signupStep === 2) return "OTP Verification";
    return "Secure Access";
  }, [isLogin, signupStep]);

  const authSubtitle = useMemo(() => {
    if (isLogin) return "Sign in to continue your journey.";
    return `Step ${signupStep} of 3`;
  }, [isLogin, signupStep]);

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${isLogin}-${signupStep}`}
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
                  {signupStep === 1 && (
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
                    </>
                  )}
                  {signupStep === 2 && (
                    <>
                      <FieldInput
                        isOtp
                        placeholder="0000"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        maxLength={4}
                        inputMode="numeric"
                      />
                      <div className={styles.otpTimer}>
                        {timer > 0
                          ? `Resend OTP in ${timer}s`
                          : "OTP expired — go back and try again"}
                      </div>
                    </>
                  )}
                  {signupStep === 3 && (
                    <>
                      <FieldInput
                        icon={<Lock size={20} />}
                        isPassword
                        placeholder="New Password"
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
                    </>
                  )}
                  <Button
                    fullWidth
                    onClick={handleSignupFlow}
                    disabled={loading || (signupStep === 2 && timer === 0)}
                  >
                    {loading
                      ? "Processing..."
                      : signupStep === 3
                        ? "Finish"
                        : "Continue"}
                  </Button>
                  {signupStep > 1 && (
                    <button
                      className={styles.backButton}
                      onClick={() => setSignupStep(signupStep - 1)}
                    >
                      ← Go Back
                    </button>
                  )}
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
                    setSignupStep(1);
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
