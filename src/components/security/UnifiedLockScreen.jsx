import { useState, useRef, useEffect } from "react";
import {
  Lock,
  KeyRound,
  ShieldAlert,
  Fingerprint,
  Eye,
  EyeOff,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useApp } from "@/App.jsx";
import { Btn, cx } from "@/components/common/ui.jsx";
import { SaheliLogo } from "@/components/brand/SaheliLogo.jsx";
import { PatternLockCanvas } from "./PatternLockCanvas.jsx";
import {
  calculateLockoutDelayMs,
  unlockWithDeviceAuthenticator,
  isDeviceAuthenticatorAvailable,
} from "@/lib/authLock.ts";
import { patternToSecret } from "@/lib/vault.ts";

let failCount = 0;

export function UnifiedLockScreen() {
  const { t, unlock, prefs, vaultMeta, identity } = useApp();
  const activeMethod =
    vaultMeta?.activeLockMethod && vaultMeta.activeLockMethod !== "none"
      ? vaultMeta.activeLockMethod
      : "pin";

  const [inputVal, setInputVal] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState(activeMethod); // "pin" | "passphrase" | "pattern" | "device" | "recovery"
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  const [deviceAuthSupported, setDeviceAuthSupported] = useState(false);

  const inputRef = useRef(null);

  useEffect(() => {
    isDeviceAuthenticatorAvailable().then(setDeviceAuthSupported);
  }, []);

  useEffect(() => {
    if (lockoutRemaining <= 0) {
      inputRef.current?.focus();
    }
  }, [mode, lockoutRemaining]);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutRemaining <= 0) return;
    const interval = setInterval(() => {
      setLockoutRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setErr("");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutRemaining]);

  const handleUnlock = async (secretToUse, unlockMethod = mode) => {
    if (lockoutRemaining > 0 || busy) return;
    if (!secretToUse) {
      setErr(t("lock.enterSecret") || "Please enter your secret");
      return;
    }

    setBusy(true);
    setErr("");

    try {
      await unlock(secretToUse, unlockMethod);
      failCount = 0;
    } catch {
      failCount++;
      setInputVal("");
      const delayMs = calculateLockoutDelayMs(failCount);

      if (delayMs > 0) {
        const seconds = Math.round(delayMs / 1000);
        setLockoutRemaining(seconds);
        setErr(
          t("lock.lockoutNotice", { s: seconds }) ||
            `Too many failed attempts. Please wait ${seconds} seconds.`,
        );
      } else {
        setErr(
          unlockMethod === "recovery"
            ? t("lock.invalidRecovery") || "Invalid recovery key. Please check the code."
            : t("lock.wrongSecret") || "Incorrect unlock secret. Please try again.",
        );
      }
    } finally {
      setBusy(false);
    }
  };

  const handleDeviceUnlock = async () => {
    if (lockoutRemaining > 0 || busy) return;
    setBusy(true);
    setErr("");
    try {
      await unlock("", "device");
      failCount = 0;
    } catch (e) {
      setErr(t("lock.deviceFailed") || "Device verification was not completed or was cancelled.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="region"
      aria-label={t("lock.screenAria") || "Application Lock Screen"}
      className="flex min-h-screen flex-col items-center justify-center p-6 bg-radial from-background via-background to-accent/10"
    >
      <div className="w-full max-w-sm rounded-3xl border border-border/80 bg-card/95 p-8 shadow-xl backdrop-blur-md space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
        {/* Branding & Serial ID */}
        <div className="flex flex-col items-center space-y-2">
          <SaheliLogo className="h-12 w-12" />
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            {t("lock.title") || "Saheli Vault"}
          </h1>
          {identity?.serialId && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/50 border border-border/50 text-[11px] font-mono font-medium text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" />
              <span>{identity.serialId}</span>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            {mode === "recovery"
              ? t("lock.recoveryPrompt") || "Enter your 24-character Recovery Key (REC-...)"
              : t("lock.subtitle") || "Your health records are encrypted on this device."}
          </p>
        </div>

        {/* Lockout notice */}
        {lockoutRemaining > 0 ? (
          <div
            role="alert"
            className="flex items-center gap-2 p-3 rounded-2xl bg-destructive/10 border border-destructive/20 text-xs text-destructive text-left"
          >
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>
              {t("lock.lockoutNotice", { s: lockoutRemaining }) ||
                `Too many failed attempts. Try again in ${lockoutRemaining}s.`}
            </span>
          </div>
        ) : err ? (
          <p role="alert" className="text-xs font-medium text-destructive">
            {err}
          </p>
        ) : null}

        {/* Dynamic Unlock Input depending on Mode */}
        {mode === "pin" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleUnlock(inputVal, "pin");
            }}
            className="space-y-4"
          >
            <div className="relative">
              <input
                ref={inputRef}
                type={showPassword ? "text" : "password"}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={12}
                disabled={busy || lockoutRemaining > 0}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value.replace(/\D/g, ""))}
                placeholder={t("lock.pinPlaceholder") || "Enter PIN (4-12 digits)"}
                className="w-full text-center tracking-widest text-lg font-mono rounded-2xl border border-input bg-background/50 px-4 py-3 text-foreground shadow-2xs focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label={showPassword ? "Hide PIN" : "Show PIN"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <Btn
              type="submit"
              disabled={busy || lockoutRemaining > 0 || !inputVal}
              className="w-full justify-center py-2.5 rounded-2xl"
            >
              <Lock className="h-4 w-4 mr-2" />
              {busy ? t("common.loading") || "Unlocking..." : t("lock.unlock") || "Unlock"}
            </Btn>
          </form>
        )}

        {mode === "passphrase" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleUnlock(inputVal, "passphrase");
            }}
            className="space-y-4"
          >
            <div className="relative">
              <input
                ref={inputRef}
                type={showPassword ? "text" : "password"}
                disabled={busy || lockoutRemaining > 0}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder={t("lock.passphrasePlaceholder") || "Enter Passphrase"}
                className="w-full rounded-2xl border border-input bg-background/50 px-4 py-3 text-foreground shadow-2xs focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label={showPassword ? "Hide passphrase" : "Show passphrase"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <Btn
              type="submit"
              disabled={busy || lockoutRemaining > 0 || !inputVal}
              className="w-full justify-center py-2.5 rounded-2xl"
            >
              <Lock className="h-4 w-4 mr-2" />
              {busy ? t("common.loading") || "Unlocking..." : t("lock.unlock") || "Unlock"}
            </Btn>
          </form>
        )}

        {mode === "pattern" && (
          <PatternLockCanvas
            disabled={busy || lockoutRemaining > 0}
            error={Boolean(err)}
            t={t}
            onComplete={(nodes) => {
              try {
                const secret = patternToSecret(nodes);
                handleUnlock(secret, "pattern");
              } catch (e) {
                setErr(e.message);
              }
            }}
          />
        )}

        {mode === "recovery" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleUnlock(inputVal.trim().toUpperCase(), "recovery");
            }}
            className="space-y-4"
          >
            <input
              ref={inputRef}
              type="text"
              disabled={busy || lockoutRemaining > 0}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="REC-XXXX-XXXX-XXXX-XXXX"
              className="w-full text-center tracking-wider text-sm font-mono rounded-2xl border border-input bg-background/50 px-4 py-3 text-foreground shadow-2xs focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
            />
            <Btn
              type="submit"
              disabled={busy || lockoutRemaining > 0 || !inputVal}
              className="w-full justify-center py-2.5 rounded-2xl"
            >
              <KeyRound className="h-4 w-4 mr-2" />
              {busy ? t("common.loading") || "Verifying..." : t("lock.recover") || "Recover Vault"}
            </Btn>
          </form>
        )}

        {/* Device Authenticator / Biometric Button (if available) */}
        {deviceAuthSupported && vaultMeta?.wrappers?.device && mode !== "recovery" && (
          <div className="pt-2 border-t border-border/40">
            <button
              type="button"
              disabled={busy || lockoutRemaining > 0}
              onClick={handleDeviceUnlock}
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-2xl border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              <Fingerprint className="h-4 w-4" />
              {t("lock.unlockWithDevice") || "Unlock with your device"}
            </button>
          </div>
        )}

        {/* Footer Alternatives & Recovery Link */}
        <div className="pt-2 flex flex-col items-center gap-2 text-xs text-muted-foreground">
          {mode === "recovery" ? (
            <button
              type="button"
              onClick={() => {
                setMode(activeMethod);
                setErr("");
                setInputVal("");
              }}
              className="hover:text-foreground underline transition-colors cursor-pointer"
            >
              ← {t("lock.backToSecret") || "Back to normal unlock"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMode("recovery");
                setErr("");
                setInputVal("");
              }}
              className="hover:text-foreground underline transition-colors cursor-pointer"
            >
              {t("lock.forgotPrompt") || "Forgot your unlock secret? Use Recovery Key"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
