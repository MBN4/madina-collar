import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "../store/authStore";
import styles from "../styles/Auth.module.css";
import api from "../utils/api";

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

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.hero}>
          <div className={styles.heroBadge}>Madina Collar</div>
          <h1 className={styles.heroTitle}>{authTitle}</h1>
          <p className={styles.subtitle}>
            {isLogin
              ? "Sign in to continue your premium fabric ordering journey."
              : "Create your account and continue from where the mobile app left off."}
          </p>
        </div>

        <div className={styles.form}>
          {isLogin ? (
            <>
              <label className={styles.fieldLabel}>
                Phone Number
                <input
                  className={styles.input}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="03XXXXXXXXX"
                  maxLength={11}
                />
              </label>
              <label className={styles.fieldLabel}>
                Password
                <input
                  className={styles.input}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                />
              </label>
              <button
                className={styles.btn}
                onClick={handleLogin}
                disabled={loading}
              >
                {loading ? "SIGNING IN..." : "SIGN IN"}
              </button>
            </>
          ) : (
            <>
              {signupStep === 1 && (
                <>
                  <label className={styles.fieldLabel}>
                    Full Name
                    <input
                      className={styles.input}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Your name"
                    />
                  </label>
                  <label className={styles.fieldLabel}>
                    Phone Number
                    <input
                      className={styles.input}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="03XXXXXXXXX"
                      maxLength={11}
                    />
                  </label>
                </>
              )}
              {signupStep === 2 && (
                <label className={styles.fieldLabel}>
                  OTP Code
                  <input
                    className={styles.input}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 4-digit OTP"
                    maxLength={6}
                  />
                </label>
              )}
              {signupStep === 3 && (
                <>
                  <label className={styles.fieldLabel}>
                    Password
                    <input
                      className={styles.input}
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a password"
                    />
                  </label>
                  <label className={styles.fieldLabel}>
                    Confirm Password
                    <input
                      className={styles.input}
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                    />
                  </label>
                </>
              )}
              <button
                className={styles.btn}
                onClick={handleSignupFlow}
                disabled={loading || (signupStep === 2 && timer === 0)}
              >
                {loading
                  ? "PROCESSING..."
                  : signupStep === 3
                    ? "FINISH"
                    : "CONTINUE"}
              </button>
              {signupStep > 1 && (
                <button
                  className={styles.secondaryAction}
                  onClick={() => setSignupStep(signupStep - 1)}
                >
                  ← Go Back
                </button>
              )}
            </>
          )}

          <div className={styles.switchRow}>
            <span>
              {isLogin ? "Don't have an account?" : "Already have an account?"}
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

          {message && (
            <div
              className={`${styles.message} ${isError ? styles.messageError : ""}`}
            >
              {message}
            </div>
          )}

          {!isLogin && signupStep === 2 && (
            <div className={styles.timer}>
              {timer > 0
                ? `OTP expires in ${timer}s`
                : "OTP expired — go back and try again"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
