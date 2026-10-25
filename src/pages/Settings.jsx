import { useState, useEffect } from "react";
import {
  Palette,
  Shield,
  Activity,
  Database,
  Globe,
  Lock,
  Eye,
  EyeOff,
  Trash2,
  Download,
  Upload,
  AlertTriangle,
  AlertCircle,
  Check,
  Plus,
  RefreshCw,
  FileText,
  Volume2,
  Bell,
  MessageSquareWarning,
  Play,
  Square,
  Stethoscope,
  HeartPulse,
  ChevronRight,
  ShieldCheck,
  Users,
  KeyRound,
  Copy,
  Fingerprint,
  RotateCcw,
  HeartHandshake,
  Flower2,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useApp } from "@/App.jsx";
import {
  isDeviceAuthenticatorAvailable,
  validatePinInput,
  validatePassphraseInput,
  validatePatternInput,
} from "@/lib/authLock.ts";
import { patternToSecret } from "@/lib/vault.ts";
import { PatternLockCanvas } from "@/components/security/PatternLockCanvas.jsx";
import {
  Btn,
  Card,
  PageTitle,
  Toggle,
  Chip,
  inputCls,
  Status,
  cx,
} from "@/components/common/ui.jsx";
import {
  NovaHeading,
  NovaText,
  NovaButton,
  NovaCard,
  NovaBadge,
  NovaPageHeader,
  NovaSegmented,
  NovaChip,
  NovaDialog,
} from "@/components/nova";
import { SYMPTOMS } from "@/data/symptoms.js";
import {
  exportJSON,
  exportCSV,
  parseImport,
  importPreview,
  parseCSVImport,
  generateDoctorSummaryPDF,
  generateClinicalSummaryPDF,
  parsePDFImport,
  defaultHealthConditions,
} from "@/lib/exportImport.js";
import { QUESTIONNAIRE_CONDITIONS, CONFIRMATION_STATUSES } from "@/content/conditions.js";
import {
  loadChimeSettings,
  saveChimeSettings,
  playSaheliChime,
  stopSaheliChime,
} from "@/lib/chime.js";
import { isValidPin, isValidPassphrase, isValidSecret } from "@/lib/encryption.js";
import { todayStr } from "@/lib/localDate.js";
import { LANGUAGES } from "@/i18n/languages.js";

function download(name, data, type) {
  const blob = data instanceof Blob ? data : new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function PinInput({ id, label, value, onChange, isPassphrase = false }) {
  return (
    <label htmlFor={id} className="block font-semibold text-xs text-foreground mb-1">
      {label}
      <input
        id={id}
        type="password"
        inputMode={isPassphrase ? "text" : "numeric"}
        maxLength={isPassphrase ? 64 : 4}
        autoComplete="off"
        value={value}
        onChange={(e) =>
          onChange(isPassphrase ? e.target.value : e.target.value.replace(/\D/g, ""))
        }
        className={cx(
          inputCls,
          isPassphrase
            ? "h-11 rounded-2xl px-4 text-base tracking-widest"
            : "h-11 rounded-2xl tracking-[0.4em] text-center text-lg",
        )}
      />
    </label>
  );
}

function ExportBlock() {
  const { t, record, prefs, analysis } = useApp();
  const [pending, setPending] = useState(null);
  const base = `${prefs.discreet ? "diary" : "saheli"}-${todayStr()}`;
  return (
    <div className="space-y-3">
      <div className="grid gap-2.5 sm:grid-cols-3">
        <Btn
          variant="outline"
          className="min-h-12 rounded-2xl flex items-center justify-center gap-2 font-bold text-xs"
          onClick={() => setPending("json")}
        >
          <Download className="h-4 w-4" />
          <span>{t("set.exportJson")}</span>
        </Btn>
        <Btn
          variant="outline"
          className="min-h-12 rounded-2xl flex items-center justify-center gap-2 font-bold text-xs"
          onClick={() => setPending("csv")}
        >
          <Download className="h-4 w-4" />
          <span>{t("set.exportCsv")}</span>
        </Btn>
        <Btn
          variant="outline"
          className="min-h-12 rounded-2xl flex items-center justify-center gap-2 font-bold text-xs"
          onClick={() => setPending("pdf")}
        >
          <FileText className="h-4 w-4" />
          <span>{t("set.exportPdf")}</span>
        </Btn>
      </div>
      {pending && (
        <div
          role="alertdialog"
          aria-label={t("set.exportWarn")}
          className="rounded-3xl border border-accent bg-accent/90 p-4 text-accent-foreground text-xs space-y-2.5 animate-fade-in"
        >
          <p className="leading-relaxed font-medium">{t("set.exportWarn")}</p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Btn
              size="sm"
              onClick={() => {
                if (pending === "json") {
                  download(`${base}.json`, exportJSON(record), "application/json");
                } else if (pending === "csv") {
                  download(`${base}.csv`, "\uFEFF" + exportCSV(record), "text/csv;charset=utf-8");
                } else if (pending === "pdf") {
                  const pdfBytes = generateClinicalSummaryPDF(record, analysis, {
                    lang: prefs.lang,
                    today: todayStr(),
                  });
                  download(`${base}-health-summary.pdf`, pdfBytes, "application/pdf");
                }
                setPending(null);
              }}
            >
              {t("set.exportConfirm")}
            </Btn>
            <Btn size="sm" variant="ghost" onClick={() => setPending(null)}>
              {t("common.cancel")}
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}

function AppLockSection() {
  const {
    t,
    meta,
    vaultMeta,
    isVaultLocked,
    isVaultUnlocked,
    unlock,
    setupVaultLock,
    changeVaultLock,
    disableVaultLock,
    regenerateRecoveryKey,
    lock,
    prefs,
    setPrefs,
  } = useApp();

  const activeMethod = vaultMeta?.activeLockMethod || (meta?.pin?.enabled ? "pin" : "none");
  const enabled = activeMethod !== "none";

  const [mode, setMode] = useState(null); // null | "setup" | "change" | "disable"
  const [selectedMethod, setSelectedMethod] = useState("pin"); // "pin" | "passphrase" | "pattern" | "device"
  const [pinA, setPinA] = useState("");
  const [pinB, setPinB] = useState("");
  const [pinC, setPinC] = useState("");
  const [patternNodes, setPatternNodes] = useState([]);
  const [patternConfirmNodes, setPatternConfirmNodes] = useState([]);
  const [patternStep, setPatternStep] = useState("draw"); // "draw" | "confirm"
  const [recoveryCode, setRecoveryCode] = useState("");
  const [copiedRecovery, setCopiedRecovery] = useState(false);
  const [deviceSupported, setDeviceSupported] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [warnChecked, setWarnChecked] = useState(false);
  const [unlockInput, setUnlockInput] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [unlockErr, setUnlockErr] = useState("");

  useEffect(() => {
    isDeviceAuthenticatorAvailable().then(setDeviceSupported);
  }, []);

  const resetForm = () => {
    setMode(null);
    setPinA("");
    setPinB("");
    setPinC("");
    setPatternNodes([]);
    setPatternConfirmNodes([]);
    setPatternStep("draw");
    setWarnChecked(false);
    setMsg(null);
  };

  const handleRevealRecoveryKey = async () => {
    setBusy(true);
    setMsg(null);
    try {
      if (regenerateRecoveryKey) {
        const code = await regenerateRecoveryKey();
        setRecoveryCode(code);
      }
    } catch (e) {
      setMsg({ key: e.message || "set.failed", tone: "err" });
    } finally {
      setBusy(false);
    }
  };

  const handleCopyRecovery = () => {
    if (!recoveryCode) return;
    navigator.clipboard?.writeText(recoveryCode).then(() => {
      setCopiedRecovery(true);
      setTimeout(() => setCopiedRecovery(false), 2000);
    });
  };

  const handleSetupOrChange = async (e) => {
    if (e) e.preventDefault();
    setBusy(true);
    setMsg(null);

    try {
      let secretToUse = "";
      if (selectedMethod === "pin") {
        const check = validatePinInput(mode === "change" ? pinB : pinA);
        if (!check.valid) throw new Error(check.error || "set.pinInvalid");
        if ((mode === "change" ? pinB : pinA) !== (mode === "change" ? pinC : pinB)) {
          throw new Error("set.pinMismatch");
        }
        secretToUse = mode === "change" ? pinB : pinA;
      } else if (selectedMethod === "passphrase") {
        const check = validatePassphraseInput(mode === "change" ? pinB : pinA);
        if (!check.valid) throw new Error(check.error || "set.passphraseInvalid");
        if ((mode === "change" ? pinB : pinA) !== (mode === "change" ? pinC : pinB)) {
          throw new Error("set.pinMismatch");
        }
        secretToUse = mode === "change" ? pinB : pinA;
      } else if (selectedMethod === "pattern") {
        if (patternNodes.length < 4) throw new Error("Pattern must connect at least 4 dots");
        if (patternStep === "draw") {
          setPatternStep("confirm");
          setBusy(false);
          return;
        }
        if (patternNodes.join("-") !== patternConfirmNodes.join("-")) {
          setPatternConfirmNodes([]);
          setPatternStep("draw");
          throw new Error("set.pinMismatch");
        }
        secretToUse = patternToSecret(patternNodes);
      } else if (selectedMethod === "device") {
        if (!deviceSupported) throw new Error("lock.deviceFailed");
      }

      if (mode === "setup") {
        const res = await setupVaultLock(selectedMethod, secretToUse);
        if (res?.recoveryKey) {
          setRecoveryCode(res.recoveryKey);
        }
        resetForm();
        setMsg({ key: "set.pinEnabled", tone: "ok" });
      } else if (mode === "change") {
        await changeVaultLock(selectedMethod, secretToUse);
        resetForm();
        setMsg({ key: "set.pinChanged", tone: "ok" });
      }
    } catch (err) {
      setMsg({ key: err.message || "set.failed", tone: "err" });
    } finally {
      setBusy(false);
    }
  };

  const handleDisableLock = async (e) => {
    if (e) e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      let secretToUse = pinA;
      if (activeMethod === "pattern") {
        if (patternNodes.length < 4) throw new Error("Pattern must connect at least 4 dots");
        secretToUse = patternToSecret(patternNodes);
      }
      await disableVaultLock(secretToUse, activeMethod);
      resetForm();
      setMsg({ key: "set.pinDisabled", tone: "ok" });
    } catch (err) {
      setMsg({ key: err.message || "set.pinWrong", tone: "err" });
    } finally {
      setBusy(false);
    }
  };

  const getMethodLabel = (m) => {
    switch (m) {
      case "pin":
        return t("set.secretTypePin");
      case "passphrase":
        return t("set.secretTypePassphrase");
      case "pattern":
        return "3x3 Pattern";
      case "device":
        return "Device Biometrics / Passkey";
      default:
        return t("common.off");
    }
  };

  return (
    <div className="space-y-5">
      {/* 3-Point Security & Vault Status Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-3xl bg-muted/30 border border-border/70 text-xs">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
            Storage Encryption
          </span>
          <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>Active (AES-256-GCM)</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            All period logs and diary notes are cryptographically sealed locally.
          </p>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
            App Lock
          </span>
          <div className="flex items-center gap-1.5 font-bold text-foreground">
            <Lock className="h-4 w-4 text-primary shrink-0" />
            <span>
              {enabled ? `Enabled (${getMethodLabel(activeMethod)})` : "Disabled (No PIN)"}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {enabled
              ? "Unlocking required before viewing or changing protected settings."
              : "App launches directly without requiring a PIN or password."}
          </p>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
            Vault Session
          </span>
          <div className="flex items-center gap-1.5 font-bold">
            {isVaultLocked ? (
              <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Locked (Auth Required)
              </span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Check className="h-4 w-4 shrink-0" />
                Unlocked & Ready
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {isVaultLocked
              ? "Authenticate below to view recovery keys or modify security settings."
              : "Active encryption keys are loaded in memory for this session."}
          </p>
        </div>
      </div>

      {/* Header with Active Method Badge and Lock Now Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div>
          <h3 className="font-bold text-sm sm:text-base text-foreground flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary" />
            <span>{t("set.lockMethod")}</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {enabled ? `${t("set.pinOn")} (${getMethodLabel(activeMethod)})` : t("set.pinOff")}
          </p>
        </div>

        {enabled && !isVaultLocked && (
          <Btn
            type="button"
            size="sm"
            variant="outline"
            className="rounded-xl text-xs font-bold gap-1.5 cursor-pointer"
            onClick={lock}
          >
            <Lock className="h-3.5 w-3.5 text-primary" />
            <span>{t("set.lockNow")}</span>
          </Btn>
        )}
      </div>

      {/* When Vault is Locked: Display Dedicated Unlock Form (Never show 'New PIN' form when locked!) */}
      {isVaultLocked && (
        <div className="p-5 rounded-3xl border border-amber-500/30 bg-amber-500/5 space-y-4 animate-fade-in">
          <div className="space-y-1">
            <h4 className="font-bold text-xs sm:text-sm text-foreground flex items-center gap-2">
              <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <span>Unlock Vault to View or Change Security Settings</span>
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your sensitive records are locked. To prevent accidentally overwriting inaccessible
              encryption keys, please authenticate below before changing or viewing security
              configurations.
            </p>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setUnlocking(true);
              setUnlockErr("");
              try {
                await unlock(unlockInput, activeMethod);
                setUnlockInput("");
                setMsg({ key: "Vault unlocked successfully.", tone: "ok" });
              } catch {
                setUnlockErr(t("set.pinWrong") || "Incorrect unlock secret. Please try again.");
              } finally {
                setUnlocking(false);
              }
            }}
            className="space-y-3"
          >
            {activeMethod === "pattern" ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-foreground">
                  Draw your 3x3 pattern to unlock:
                </p>
                <div className="flex justify-center bg-card rounded-2xl border border-border p-2">
                  <PatternLockCanvas
                    onComplete={(nodes) => {
                      setUnlockInput(patternToSecret(nodes));
                    }}
                    t={t}
                  />
                </div>
              </div>
            ) : (
              <PinInput
                id="unlock-vault-curr"
                label={t("set.pinCurrent") || "Enter Current Secret"}
                value={unlockInput}
                onChange={setUnlockInput}
                isPassphrase={activeMethod === "passphrase"}
              />
            )}

            {unlockErr && (
              <p role="alert" className="text-xs font-semibold text-destructive">
                {unlockErr}
              </p>
            )}

            <Btn
              type="submit"
              disabled={unlocking || !unlockInput}
              className="text-xs font-bold w-full sm:w-auto"
            >
              {unlocking ? t("set.working") : "Unlock Vault"}
            </Btn>
          </form>
        </div>
      )}

      {/* Device Capability Notice */}
      <div className="p-3 rounded-2xl bg-muted/40 border border-border/60 text-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-foreground font-semibold">
          <Fingerprint className="h-4 w-4 text-primary shrink-0" />
          <span>Device Platform Biometrics:</span>
        </div>
        <span
          className={cx(
            "text-[11px] font-bold px-2.5 py-0.5 rounded-full",
            deviceSupported
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "bg-muted text-muted-foreground",
          )}
        >
          {deviceSupported ? "Supported on this device" : "Unavailable on this device"}
        </span>
      </div>

      {/* Controls only available when Vault is Unlocked */}
      {!isVaultLocked && (
        <>
          {/* Mode Action Buttons */}
          {!mode && (
            <div className="flex flex-wrap gap-2 pt-1">
              {!enabled ? (
                <Btn
                  size="sm"
                  className="rounded-xl font-bold text-xs"
                  onClick={() => {
                    setMode("setup");
                    setSelectedMethod("pin");
                  }}
                >
                  {t("set.pinEnable")}
                </Btn>
              ) : (
                <>
                  <Btn
                    size="sm"
                    variant="outline"
                    className="rounded-xl font-bold text-xs"
                    onClick={() => {
                      setMode("change");
                      setSelectedMethod(activeMethod);
                    }}
                  >
                    {t("set.pinChange")}
                  </Btn>
                  <Btn
                    size="sm"
                    variant="outline"
                    className="rounded-xl font-bold text-xs text-destructive hover:text-destructive"
                    onClick={() => setMode("disable")}
                  >
                    {t("set.pinDisable")}
                  </Btn>
                </>
              )}
            </div>
          )}

          {/* Form: Setup / Change Mode */}
          {(mode === "setup" || mode === "change") && (
            <form
              onSubmit={handleSetupOrChange}
              className="space-y-4 rounded-3xl border border-border/70 bg-muted/30 p-5 animate-fade-in"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">
                  Choose Unlock Method:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: "pin", label: t("set.secretTypePin") },
                    { id: "passphrase", label: t("set.secretTypePassphrase") },
                    { id: "pattern", label: "3x3 Pattern" },
                    ...(deviceSupported ? [{ id: "device", label: "Device Biometrics" }] : []),
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setSelectedMethod(m.id);
                        setPinA("");
                        setPinB("");
                        setPinC("");
                        setPatternNodes([]);
                        setPatternConfirmNodes([]);
                        setPatternStep("draw");
                      }}
                      className={cx(
                        "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                        selectedMethod === m.id
                          ? "bg-primary text-primary-foreground shadow-2xs"
                          : "bg-card border border-border text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* PIN Inputs */}
              {selectedMethod === "pin" && (
                <div className="space-y-3">
                  <PinInput
                    id="pin-new"
                    label={t("set.pinNew")}
                    value={mode === "change" ? pinB : pinA}
                    onChange={mode === "change" ? setPinB : setPinA}
                    isPassphrase={false}
                  />
                  <PinInput
                    id="pin-confirm"
                    label={t("set.pinConfirm")}
                    value={mode === "change" ? pinC : pinB}
                    onChange={mode === "change" ? setPinC : setPinB}
                    isPassphrase={false}
                  />
                </div>
              )}

              {/* Passphrase Inputs */}
              {selectedMethod === "passphrase" && (
                <div className="space-y-3">
                  <PinInput
                    id="pass-new"
                    label="New Passphrase (min 6 characters)"
                    value={mode === "change" ? pinB : pinA}
                    onChange={mode === "change" ? setPinB : setPinA}
                    isPassphrase={true}
                  />
                  <PinInput
                    id="pass-confirm"
                    label="Repeat Passphrase"
                    value={mode === "change" ? pinC : pinB}
                    onChange={mode === "change" ? setPinC : setPinB}
                    isPassphrase={true}
                  />
                </div>
              )}

              {/* Pattern Canvas */}
              {selectedMethod === "pattern" && (
                <div className="space-y-3">
                  <p className="text-xs font-bold text-foreground">
                    {patternStep === "draw"
                      ? "Draw your 3x3 pattern (connect 4+ points):"
                      : "Draw pattern again to confirm:"}
                  </p>
                  <div className="flex justify-center bg-card rounded-2xl border border-border p-2">
                    <PatternLockCanvas
                      onComplete={(nodes) => {
                        if (patternStep === "draw") {
                          setPatternNodes(nodes);
                          setPatternStep("confirm");
                        } else {
                          setPatternConfirmNodes(nodes);
                        }
                      }}
                      t={t}
                    />
                  </div>
                  {patternStep === "confirm" && (
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">
                        Pattern recorded. Confirm above.
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setPatternNodes([]);
                          setPatternConfirmNodes([]);
                          setPatternStep("draw");
                        }}
                        className="text-primary font-bold hover:underline"
                      >
                        Redraw original
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Device Biometrics Explanation */}
              {selectedMethod === "device" && (
                <div className="p-3.5 rounded-2xl bg-card border border-border space-y-1 text-xs">
                  <span className="font-bold text-foreground flex items-center gap-1.5">
                    <Fingerprint className="h-4 w-4 text-primary" />
                    {t("lock.unlockWithDevice")}
                  </span>
                  <p className="text-muted-foreground leading-relaxed">
                    Saheli will bind an on-device platform credential using your fingerprint, face,
                    or lock-screen PIN to wrap your health data encryption key.
                  </p>
                </div>
              )}

              {/* Safeguard Warning */}
              {mode === "setup" && (
                <label className="flex items-start gap-2 text-xs text-muted-foreground cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={warnChecked}
                    onChange={(e) => setWarnChecked(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-border text-primary"
                  />
                  <span>{t("set.pinWarn")}</span>
                </label>
              )}

              <div className="flex gap-2 pt-2">
                <Btn
                  type="submit"
                  disabled={busy || (mode === "setup" && !warnChecked)}
                  className="text-xs font-bold"
                >
                  {busy ? t("set.working") : t("common.save")}
                </Btn>
                <Btn
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="text-xs font-bold"
                >
                  {t("common.cancel")}
                </Btn>
              </div>
            </form>
          )}

          {/* Form: Disable Lock Mode */}
          {mode === "disable" && (
            <form
              onSubmit={handleDisableLock}
              className="space-y-4 rounded-3xl border border-destructive/30 bg-destructive/5 p-5 animate-fade-in"
            >
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-destructive">{t("set.pinDisable")}</h4>
                <p className="text-xs text-muted-foreground">
                  Enter your current unlock secret to turn off encryption locking.
                </p>
              </div>

              {activeMethod === "pattern" ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-foreground">
                    Draw your current pattern:
                  </p>
                  <div className="flex justify-center bg-card rounded-2xl border border-border p-2">
                    <PatternLockCanvas onComplete={(nodes) => setPatternNodes(nodes)} t={t} />
                  </div>
                </div>
              ) : (
                <PinInput
                  id="pin-curr"
                  label={t("set.pinCurrent")}
                  value={pinA}
                  onChange={setPinA}
                  isPassphrase={activeMethod === "passphrase"}
                />
              )}

              <div className="flex gap-2 pt-2">
                <Btn
                  type="submit"
                  variant="destructive"
                  disabled={busy}
                  className="text-xs font-bold"
                >
                  {busy ? t("set.working") : t("set.pinDisable")}
                </Btn>
                <Btn
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="text-xs font-bold"
                >
                  {t("common.cancel")}
                </Btn>
              </div>
            </form>
          )}

          {msg && <Status msg={msg.key && (t(msg.key) || msg.key)} tone={msg.tone} />}

          {/* Emergency Recovery Key Management */}
          <div className="pt-4 border-t border-border/50 space-y-3">
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-foreground flex items-center gap-1.5">
                <KeyRound className="h-4 w-4 text-primary" />
                <span>{t("set.recoveryKeyTitle")}</span>
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {t("set.recoveryKeyDesc")}
              </p>
            </div>

            {recoveryCode ? (
              <div className="p-3.5 rounded-2xl bg-muted/40 border border-border flex flex-wrap items-center justify-between gap-3 animate-fade-in">
                <span className="font-mono text-xs sm:text-sm font-bold tracking-wider text-foreground">
                  {recoveryCode}
                </span>
                <div className="flex items-center gap-2">
                  <Btn
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleCopyRecovery}
                    className="text-xs font-bold gap-1"
                  >
                    <Copy className="h-3 w-3" />
                    <span>{copiedRecovery ? "✓" : t("set.export")}</span>
                  </Btn>
                  <Btn
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setRecoveryCode("")}
                    className="text-xs"
                  >
                    Hide
                  </Btn>
                </div>
              </div>
            ) : (
              <Btn
                type="button"
                size="sm"
                variant="outline"
                onClick={handleRevealRecoveryKey}
                disabled={busy}
                className="text-xs font-bold gap-1.5"
              >
                <KeyRound className="h-3.5 w-3.5" />
                <span>{t("set.showRecoveryKey")}</span>
              </Btn>
            )}
          </div>
        </>
      )}

      {/* Auto-Lock Inactivity Timeout & Background Blur Lock */}
      <div className="pt-4 border-t border-border/50 space-y-4">
        <div>
          <label htmlFor="autolock-select" className="block text-xs font-bold text-foreground mb-1">
            {t("set.autoLockTimeout")}
          </label>
          <select
            id="autolock-select"
            value={prefs.autoLockMinutes ?? 10}
            onChange={(e) => setPrefs({ autoLockMinutes: Number(e.target.value) })}
            className="h-9 w-full sm:w-64 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-foreground cursor-pointer"
          >
            <option value="1">1 min</option>
            <option value="5">5 min</option>
            <option value="10">10 min</option>
            <option value="30">30 min</option>
            <option value="0">{t("common.off")}</option>
          </select>
        </div>

        <Toggle
          label="Lock on Background"
          desc="Lock immediately when you switch away or minimize the app"
          checked={Boolean(prefs.autoLockOnBackground)}
          onChange={(v) => setPrefs({ autoLockOnBackground: v })}
        />
      </div>
    </div>
  );
}

function ExperienceAndAgeSection() {
  const { t, record, userRole, switchRole, agePolicy, updateDateOfBirth, today } = useApp();
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [editingDob, setEditingDob] = useState(false);
  const [dobInput, setDobInput] = useState(record?.settings?.dob || "");
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const targetRole = userRole === "owner" ? "partner" : "owner";

  const handleConfirmSwitch = async () => {
    setBusy(true);
    try {
      await switchRole(targetRole);
      setShowSwitchModal(false);
    } catch {
      setErrorMsg(t("set.failed") || "Failed to switch role.");
    } finally {
      setBusy(false);
    }
  };

  const handleSaveDob = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    if (!dobInput) return;
    setBusy(true);
    try {
      await updateDateOfBirth(dobInput);
      setEditingDob(false);
    } catch {
      setErrorMsg(t("onb.dobInvalid") || "Invalid date of birth.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div className="space-y-0.5">
          <h2 className="font-bold text-sm sm:text-base text-foreground flex items-center gap-2">
            <HeartHandshake className="h-4 w-4 text-primary" />
            <span>{t("set.roleTitle") || "My Saheli Experience"}</span>
          </h2>
          <p className="text-xs text-muted-foreground">
            {t("set.roleDesc", {
              role:
                userRole === "owner"
                  ? t("set.roleOwner") || "Cycle Owner"
                  : t("set.rolePartner") || "Partner",
            })}
          </p>
        </div>

        <Btn
          size="sm"
          variant="outline"
          onClick={() => setShowSwitchModal(true)}
          className="rounded-2xl text-xs font-semibold"
        >
          {t("set.roleSwitchPrompt", {
            role:
              targetRole === "owner"
                ? t("set.roleOwner") || "Cycle Owner"
                : t("set.rolePartner") || "Partner",
          })}
        </Btn>
      </div>

      {/* Date of Birth & Age Policy Status */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground">
            {t("set.dobTitle") || "Date of Birth"}:
          </span>
          <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-primary/10 text-primary">
            {agePolicy.isUnder18
              ? t("onb.dobUnder18Badge") || "Adolescent Safeguarded Mode (< 18)"
              : t("onb.dobAdultBadge") || "Full Adult Mode (18+)"}
          </span>
        </div>

        {record?.settings?.dob && !editingDob ? (
          <div className="flex items-center justify-between text-xs rounded-2xl bg-muted/30 p-3">
            <span className="text-muted-foreground">
              {agePolicy.age !== null
                ? t("onb.dobAgeNotice", { age: agePolicy.age })
                : "Configured"}
            </span>
            <button
              type="button"
              onClick={() => {
                setDobInput(record.settings.dob);
                setEditingDob(true);
              }}
              className="text-primary font-semibold hover:underline"
            >
              {t("set.dobUpdatePrompt") || "Update Date of Birth"}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSaveDob} className="space-y-2 pt-1">
            {!record?.settings?.dob && (
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                {t("set.dobMissingPrompt") ||
                  "Please add your date of birth to unlock age-appropriate guidance and features."}
              </p>
            )}
            <div className="flex gap-2">
              <input
                type="date"
                max={today}
                value={dobInput}
                onChange={(e) => setDobInput(e.target.value)}
                className={cx(inputCls, "h-11 rounded-2xl text-xs flex-1")}
              />
              <Btn
                type="submit"
                size="sm"
                disabled={busy || !dobInput}
                className="rounded-2xl px-4"
              >
                {t("common.save") || "Save"}
              </Btn>
              {editingDob && (
                <Btn
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingDob(false)}
                  className="rounded-2xl"
                >
                  {t("common.cancel") || "Cancel"}
                </Btn>
              )}
            </div>
            {errorMsg && <p className="text-xs text-destructive">{errorMsg}</p>}
          </form>
        )}
      </div>

      {/* Switch Role Confirmation Modal */}
      {showSwitchModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <h3 className="font-display text-lg font-bold text-foreground">
              {t("set.roleSwitchConfirmTitle") || "Switch Application Role?"}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {t("set.roleSwitchConfirmDesc") ||
                "Switching roles will adapt your navigation and interface. Your stored data will be preserved."}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Btn
                variant="outline"
                size="sm"
                onClick={() => setShowSwitchModal(false)}
                className="rounded-2xl"
              >
                {t("common.cancel") || "Cancel"}
              </Btn>
              <Btn
                size="sm"
                onClick={handleConfirmSwitch}
                disabled={busy}
                className="rounded-2xl font-bold"
              >
                {t("set.roleSwitchPrompt", {
                  role:
                    targetRole === "owner"
                      ? t("set.roleOwner") || "Cycle Owner"
                      : t("set.rolePartner") || "Partner",
                })}
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SerialIdentityCard() {
  const { t, identity } = useApp();
  const [copied, setCopied] = useState(false);

  const copySerial = () => {
    if (!identity?.serialId) return;
    navigator.clipboard?.writeText(identity.serialId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-sm sm:text-base text-foreground flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span>{t("set.serialId")}</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {t("set.serialIdDesc")}
          </p>
        </div>
      </div>

      <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/70 flex flex-wrap items-center justify-between gap-3">
        <div className="font-mono text-sm sm:text-base font-extrabold text-foreground tracking-wider">
          {identity?.serialId || "..."}
        </div>
        <Btn
          type="button"
          size="sm"
          variant="outline"
          onClick={copySerial}
          className="rounded-xl text-xs font-bold gap-1.5"
        >
          <Copy className="h-3.5 w-3.5" />
          <span>{copied ? "✓" : t("set.export")}</span>
        </Btn>
      </div>
    </div>
  );
}

function PartnerConnectCard() {
  const { t } = useApp();

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-sm sm:text-base text-foreground flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <span>{t("partner.title")}</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {t("partner.subtitle")}
          </p>
        </div>
      </div>

      <div className="pt-1 flex justify-end">
        <Link to="/partner">
          <Btn size="sm" className="rounded-xl text-xs font-bold gap-1.5">
            <Users className="h-3.5 w-3.5" />
            <span>{t("partner.title")}</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Btn>
        </Link>
      </div>
    </div>
  );
}

export default function Settings() {
  const {
    t,
    record,
    update,
    meta,
    prefs,
    setPrefs,
    fmtInteger,
    isDemo,
    exitDemo,
    tryDemo,
    importRecord,
    wipeAllData,
  } = useApp();

  const [activeTab, setActiveTab] = useState("display"); // 'display' | 'cycle' | 'privacy' | 'data'
  const [customInput, setCustomInput] = useState("");
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [importState, setImportState] = useState(null);
  const [importErr, setImportErr] = useState(null);
  const [chimeSettings, setChimeSettings] = useState(() => loadChimeSettings());
  const [isPlayingChime, setIsPlayingChime] = useState(false);
  const [chimeNotice, setChimeNotice] = useState("");
  const [showAddCondition, setShowAddCondition] = useState(false);
  const [conditionFilter, setConditionFilter] = useState("");

  const healthConditions = record.healthConditions || defaultHealthConditions();
  const setHealthConditions = (patch) =>
    update((r) => {
      const current = r.healthConditions || defaultHealthConditions();
      return {
        ...r,
        healthConditions: {
          ...current,
          ...patch,
          lastUpdated: todayStr(),
        },
      };
    });

  const toggleConditionItem = (condId, defaultStatus = "confirmed_diagnosis") => {
    const list = healthConditions.conditions || [];
    const exists = list.some((c) => c.id === condId);
    if (exists) {
      setHealthConditions({
        conditions: list.filter((c) => c.id !== condId),
      });
    } else {
      setHealthConditions({
        conditions: [...list, { id: condId, status: defaultStatus }],
        preferNotToSay: false,
      });
    }
  };

  const updateConditionStatus = (condId, newStatus) => {
    const list = healthConditions.conditions || [];
    setHealthConditions({
      conditions: list.map((c) => (c.id === condId ? { ...c, status: newStatus } : c)),
    });
  };

  const clearAllConditions = () => {
    setHealthConditions({
      conditions: [],
      otherText: "",
      preferNotToSay: false,
    });
  };

  const updateChime = (patch) => {
    const next = { ...chimeSettings, ...patch };
    setChimeSettings(next);
    saveChimeSettings(next);
  };

  const setSettings = (patch) => update((r) => ({ ...r, settings: { ...r.settings, ...patch } }));

  const toggleSymptom = (id) => {
    const list = record.settings.trackedSymptoms || [];
    setSettings({
      trackedSymptoms: list.includes(id) ? list.filter((x) => x !== id) : [...list, id],
    });
  };

  const addCustomSymptom = (e) => {
    e.preventDefault();
    if (!customInput.trim()) return;
    const current = record.settings?.customSymptoms || [];
    const newSym = {
      id: `c_${Date.now()}`,
      label: customInput.trim(),
      retired: false,
    };
    setSettings({ customSymptoms: [...current, newSym] });
    setCustomInput("");
  };

  const toggleRetireCustomSymptom = (id) => {
    const current = record.settings?.customSymptoms || [];
    setSettings({
      customSymptoms: current.map((s) => (s.id === id ? { ...s, retired: !s.retired } : s)),
    });
  };

  const removeCustomSymptom = (id) => {
    const current = record.settings?.customSymptoms || [];
    setSettings({ customSymptoms: current.filter((s) => s.id !== id) });
  };

  const toggleSymptomCategory = (catId) => {
    const current = record.settings?.symptomCategories || [
      "physical",
      "emotional",
      "digestive",
      "sleep_energy",
      "safety",
    ];
    const updated = current.includes(catId)
      ? current.filter((c) => c !== catId)
      : [...current, catId];
    if (!updated.includes("safety")) updated.push("safety");
    setSettings({ symptomCategories: updated });
  };

  const toggleQuickLogFavorite = (symId) => {
    const current = record.settings?.quickLogFavorites || [];
    const updated = current.includes(symId)
      ? current.filter((s) => s !== symId)
      : [...current, symId];
    setSettings({ quickLogFavorites: updated });
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportErr(null);
    try {
      const text = await file.text();
      let parseResult;
      const fileName = file.name.toLowerCase();
      if (fileName.endsWith(".csv") || file.type === "text/csv") {
        parseResult = parseCSVImport(text);
      } else if (fileName.endsWith(".pdf") || fileName.endsWith(".html")) {
        parseResult = parsePDFImport(text);
      } else {
        parseResult = parseImport(text);
      }

      if (!parseResult.ok) {
        throw new Error(parseResult.error || "set.importCorrupt");
      }
      const preview = importPreview(record, parseResult.record);
      setImportState({ parsed: parseResult.record, preview });
    } catch (err) {
      setImportErr(err.message || "set.importCorrupt");
    }
  };

  const applyImport = async (strategy) => {
    if (!importState) return;
    try {
      await importRecord(importState.parsed, strategy);
      setImportState(null);
    } catch (err) {
      setImportErr(err.message || "set.importCorrupt");
    }
  };

  const TABS = [
    { id: "display", label: t("set.display"), icon: Palette },
    { id: "cycle", label: t("set.health"), icon: Activity },
    { id: "privacy", label: t("set.privacy"), icon: Shield },
    { id: "data", label: t("set.data"), icon: Database },
    { id: "feedback", label: t("set.feedback"), icon: MessageSquareWarning },
  ];

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      <NovaPageHeader
        tag={prefs.discreet ? t("app.discreetName") : t("app.name")}
        title={t("set.title")}
      />

      {/* Settings Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 rounded-2xl bg-muted/60 p-1.5 border border-border/60">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={cx(
              "flex min-h-[44px] items-center justify-center gap-2 rounded-xl text-xs font-bold transition-all active:scale-95",
              activeTab === id
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: DISPLAY & LANGUAGE */}
      {activeTab === "display" && (
        <div className="space-y-6 animate-fade-in">
          {/* Language Selector Grid with Native Scripts */}
          <div className="nova-card-elevated p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              <h2 className="font-bold text-sm sm:text-base text-foreground">
                {t("set.language")}
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {LANGUAGES.map((l) => {
                const isSelected = prefs.lang === l.code;
                return (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => setPrefs({ lang: l.code })}
                    className={cx(
                      "flex flex-col items-start justify-center rounded-2xl p-3 text-left transition-all border active:scale-95",
                      isSelected
                        ? "border-primary bg-primary/10 text-primary font-bold shadow-xs ring-1 ring-primary/30"
                        : "border-border/60 bg-muted/20 hover:bg-muted text-foreground",
                    )}
                  >
                    <span className="text-sm font-semibold">{l.nativeName}</span>
                    <span className="text-[10px] text-muted-foreground capitalize mt-0.5">
                      {l.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Optional Latin Numerals Compatibility Toggle */}
            {prefs.lang !== "en" && (
              <div className="pt-3 border-t border-border/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-foreground">
                    {t("settings.latinNumerals") || "Standard Latin Digits (0-9)"}
                  </span>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {t("settings.latinNumeralsDesc") ||
                      "Display numbers using standard Latin digits instead of your language's native script"}
                  </p>
                  <p className="text-xs font-semibold text-primary pt-1">
                    {t("settings.nativeNumeralsPreview", {
                      n: fmtInteger ? fmtInteger(14) : 14,
                      total: fmtInteger ? fmtInteger(28) : 28,
                    }) ||
                      `Preview: Day ${fmtInteger ? fmtInteger(14) : 14} of ${fmtInteger ? fmtInteger(28) : 28}`}
                  </p>
                </div>
                <Toggle
                  checked={Boolean(
                    prefs.latinNumerals || prefs.useLatinNumerals || prefs.nativeNumerals === false,
                  )}
                  onChange={(checked) =>
                    setPrefs({
                      latinNumerals: checked,
                      useLatinNumerals: checked,
                      nativeNumerals: !checked,
                    })
                  }
                  id="latin-numerals-toggle"
                />
              </div>
            )}
          </div>

          {/* Theme, Text Size & Accessibility */}
          <div className="nova-card-elevated p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              <h2 className="font-bold text-sm sm:text-base text-foreground">{t("set.theme")}</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {["system", "light", "dark"].map((themeKey) => (
                <Chip
                  key={themeKey}
                  selected={(prefs.theme || "system") === themeKey}
                  onClick={() => setPrefs({ theme: themeKey })}
                  className="rounded-xl px-4 py-2 text-xs font-bold"
                >
                  {t(`theme.${themeKey}`)}
                </Chip>
              ))}
            </div>

            <div className="pt-3 border-t border-border/50 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t("set.textSize")}
              </span>
              <div className="flex flex-wrap gap-2">
                {["sm", "md", "lg"].map((size) => (
                  <Chip
                    key={size}
                    selected={(prefs.textSize || "md") === size}
                    onClick={() => setPrefs({ textSize: size })}
                    className="rounded-xl px-4 py-2 text-xs font-bold"
                  >
                    {t(`text.${size}`)}
                  </Chip>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-border/50 space-y-3">
              <Toggle
                label={t("set.contrast")}
                checked={!!prefs.contrast}
                onChange={(v) => setPrefs({ contrast: v })}
              />
              <Toggle
                label={t("set.readAloud")}
                checked={!!prefs.readAloud}
                onChange={(v) => setPrefs({ readAloud: v })}
              />
            </div>
          </div>

          {/* Saheli Chime & Notification Audio */}
          <div className="nova-card-elevated p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="h-5 w-5 text-primary" />
                <h2 className="font-bold text-sm sm:text-base text-foreground">
                  {t("chime.title")}
                </h2>
              </div>
              <Btn
                type="button"
                variant="outline"
                size="sm"
                onClick={async () => {
                  if (isPlayingChime) {
                    stopSaheliChime();
                    setIsPlayingChime(false);
                    return;
                  }
                  if (chimeSettings.volume <= 0) {
                    setChimeNotice(
                      "Volume is currently at 0%. Increase volume below to hear the preview.",
                    );
                    setTimeout(() => setChimeNotice(""), 3500);
                    return;
                  }
                  setChimeNotice("");
                  setIsPlayingChime(true);
                  const played = await playSaheliChime({
                    volume: chimeSettings.volume,
                    reducedSensory: chimeSettings.reducedSensory,
                    discreetMode: prefs.discreet,
                    preview: true,
                  });
                  if (!played) {
                    setIsPlayingChime(false);
                    setChimeNotice(
                      "Audio preview could not play. Please check device volume or sound permissions.",
                    );
                    setTimeout(() => setChimeNotice(""), 3500);
                    return;
                  }
                  const durMs = chimeSettings.reducedSensory ? 1800 : 1400;
                  setTimeout(() => {
                    setIsPlayingChime(false);
                  }, durMs);
                }}
                className="flex items-center gap-1.5 rounded-xl text-xs font-bold"
              >
                {isPlayingChime ? (
                  <>
                    <Square className="h-3.5 w-3.5 text-primary fill-primary" />
                    <span>{t("common.stop") || "Stop"}</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 text-primary" />
                    <span>{t("chime.preview")}</span>
                  </>
                )}
              </Btn>
            </div>

            {chimeNotice && (
              <div
                role="status"
                className="p-3 rounded-2xl bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-medium animate-fade-in border border-amber-500/30 leading-relaxed"
              >
                {chimeNotice}
              </div>
            )}

            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("chime.description")}
            </p>

            <Toggle
              label={t("chime.enableSound")}
              desc={t("chime.enableSoundDesc")}
              checked={chimeSettings.enabled}
              onChange={(v) => updateChime({ enabled: v })}
            />

            {chimeSettings.enabled && (
              <div className="space-y-3 pt-2 border-t border-border/40 text-xs">
                <div>
                  <div className="flex justify-between font-bold text-foreground mb-1">
                    <span>{t("chime.volume")}</span>
                    <span>{Math.round(chimeSettings.volume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={chimeSettings.volume}
                    onChange={(e) => updateChime({ volume: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>

                <Toggle
                  label={t("chime.reducedSensory")}
                  desc={t("chime.reducedSensoryDesc")}
                  checked={chimeSettings.reducedSensory}
                  onChange={(v) => updateChime({ reducedSensory: v })}
                />
              </div>
            )}

            <div className="rounded-2xl bg-muted/40 p-3 text-[11px] text-muted-foreground leading-relaxed border border-border/50">
              <span className="font-bold text-foreground">{t("chime.platformNoticeTitle")}: </span>
              <span>{t("chime.platformNotice")}</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CYCLE & HEALTH PREFERENCES */}
      {activeTab === "cycle" && (
        <div className="space-y-6 animate-fade-in">
          {/* Age Group & Clinical Thresholds */}
          <div className="nova-card-elevated p-5 sm:p-6 space-y-4">
            <div>
              <h2 className="font-bold text-sm sm:text-base text-foreground">{t("set.age")}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{t("set.ageHelp")}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {["under18", "adult"].map((age) => (
                <Chip
                  key={age}
                  selected={record.settings.ageGroup === age}
                  onClick={() => setSettings({ ageGroup: age })}
                  className="rounded-xl px-4 py-2 text-xs font-bold"
                >
                  {t(`age.${age}`)}
                </Chip>
              ))}
            </div>

            <div className="pt-3 border-t border-border/50 space-y-3">
              <Toggle
                label={t("set.fertility")}
                desc={t("set.fertilityDesc")}
                checked={record.settings.showFertility}
                onChange={(v) => setSettings({ showFertility: v })}
              />
              <Toggle
                label={t("set.pregnancyMode")}
                desc={t("set.pregnancyDesc")}
                checked={record.settings.showPregnancy}
                onChange={(v) => setSettings({ showPregnancy: v })}
              />
            </div>
          </div>

          {/* Health Conditions Questionnaire & Educational Personalisation */}
          <div className="nova-card-elevated p-5 sm:p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-bold text-sm sm:text-base text-foreground flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-primary" />
                  <span>{t("cond.settings.title")}</span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("cond.settings.subtitle")}
                </p>
              </div>

              <Btn
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddCondition(!showAddCondition)}
                className="rounded-xl text-xs font-bold"
              >
                {showAddCondition ? t("common.done") : `+ ${t("cond.settings.addOrEdit")}`}
              </Btn>
            </div>

            {/* Toggle: Personalisation */}
            <Toggle
              label={t("cond.settings.enablePersonalisation")}
              desc={t("cond.settings.enablePersonalisationDesc")}
              checked={healthConditions.personalisationEnabled}
              onChange={(v) => setHealthConditions({ personalisationEnabled: v })}
            />

            {/* Active Conditions List */}
            {healthConditions.conditions?.length > 0 ? (
              <div className="space-y-2 pt-2 border-t border-border/40">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                  {t("cond.settings.activeConditions")}
                </span>
                <div className="space-y-2">
                  {healthConditions.conditions.map((item) => {
                    const info = QUESTIONNAIRE_CONDITIONS.find((c) => c.id === item.id);
                    return (
                      <div
                        key={item.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-2xl border border-border/70 bg-muted/30 text-xs"
                      >
                        <div>
                          <div className="font-bold text-foreground">
                            {info ? t(info.labelKey) : item.id}
                            {item.id === "other" && healthConditions.otherText && (
                              <span className="font-normal text-muted-foreground ms-1">
                                ("{healthConditions.otherText}")
                              </span>
                            )}
                          </div>
                          {info && (
                            <p className="text-[11px] text-muted-foreground">
                              {t(info.plainNameKey)}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <select
                            value={item.status}
                            onChange={(e) => updateConditionStatus(item.id, e.target.value)}
                            className="h-8 rounded-xl border border-border bg-card px-2 text-[11px] font-semibold text-foreground"
                          >
                            {CONFIRMATION_STATUSES.map((st) => (
                              <option key={st.id} value={st.id}>
                                {t(st.labelKey)}
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            onClick={() => toggleConditionItem(item.id)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
                            aria-label={`${t("common.delete")} ${info ? t(info.labelKey) : item.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={clearAllConditions}
                    className="text-xs text-destructive hover:underline font-semibold"
                  >
                    {t("cond.settings.clearAll")}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic pt-1">
                {healthConditions.preferNotToSay
                  ? t("cond.onboarding.preferNotToSay")
                  : t("cond.settings.noConditionsRecorded")}
              </p>
            )}

            {/* Condition Picker Drawer / Inset */}
            {showAddCondition && (
              <div className="space-y-3 pt-3 border-t border-border/50 animate-fade-in">
                <input
                  type="text"
                  value={conditionFilter}
                  onChange={(e) => setConditionFilter(e.target.value)}
                  placeholder={t("cond.onboarding.searchPlaceholder")}
                  className={cx(inputCls, "h-10 text-xs rounded-xl")}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1">
                  {QUESTIONNAIRE_CONDITIONS.filter((c) => {
                    if (!conditionFilter.trim()) return true;
                    const q = conditionFilter.toLowerCase();
                    return (
                      t(c.labelKey).toLowerCase().includes(q) ||
                      t(c.plainNameKey).toLowerCase().includes(q)
                    );
                  }).map((c) => {
                    const isSelected = healthConditions.conditions?.some((x) => x.id === c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleConditionItem(c.id)}
                        className={cx(
                          "flex items-center justify-between p-2.5 rounded-xl border text-left text-xs font-semibold transition-all",
                          isSelected
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-card text-muted-foreground hover:bg-muted",
                        )}
                      >
                        <span className="truncate">{t(c.labelKey)}</span>
                        {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {healthConditions.conditions?.some((c) => c.id === "other") && (
                  <div className="pt-2">
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      {t("cond.onboarding.otherPlaceholder")}
                    </label>
                    <input
                      type="text"
                      value={healthConditions.otherText || ""}
                      onChange={(e) => setHealthConditions({ otherText: e.target.value })}
                      placeholder={t("cond.onboarding.otherPlaceholder")}
                      className={cx(inputCls, "h-9 text-xs rounded-xl")}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Medical Disclaimer */}
            <div className="rounded-2xl bg-muted/40 p-3 text-[11px] text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">
                {t("cond.onboarding.privacyTitle")}:{" "}
              </span>
              <span>{t("cond.onboarding.privacyDesc")}</span>
            </div>
          </div>

          {/* Tracked Symptoms & Categories */}
          <div className="nova-card-elevated p-5 sm:p-6 space-y-5">
            <div>
              <h2 className="font-bold text-sm sm:text-base text-foreground">
                {t("set.trackedSymptoms")}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">{t("set.trackedDesc")}</p>
            </div>

            {/* Category enable/disable toggles */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t("comm.categoryAll")}
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { id: "physical", label: t("sym.catPhysical") },
                  { id: "emotional", label: t("sym.catEmotional") },
                  { id: "digestive", label: t("sym.catDigestive") },
                  { id: "sleep_energy", label: t("sym.catSleepEnergy") },
                ].map((cat) => {
                  const enabled = (
                    record.settings?.symptomCategories || [
                      "physical",
                      "emotional",
                      "digestive",
                      "sleep_energy",
                      "safety",
                    ]
                  ).includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleSymptomCategory(cat.id)}
                      className={cx(
                        "flex items-center justify-between p-2.5 rounded-2xl border text-xs font-bold transition-all",
                        enabled
                          ? "bg-primary/10 border-primary text-primary"
                          : "bg-muted/40 border-border/60 text-muted-foreground",
                      )}
                    >
                      <span>{cat.label}</span>
                      <span className="text-[10px]">{enabled ? "✓" : "+"}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Symptom chips */}
            <div className="space-y-2 pt-2 border-t border-border/50">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t("set.symptoms")}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SYMPTOMS.map((s) => (
                  <Chip
                    key={s.id}
                    icon={s.icon}
                    selected={record.settings.trackedSymptoms.includes(s.id)}
                    onClick={() => toggleSymptom(s.id)}
                    className="rounded-xl"
                  >
                    {t(`sym.${s.id}`)}
                  </Chip>
                ))}
              </div>
            </div>

            {/* Quick Log Favorites Selection */}
            <div className="space-y-2 pt-2 border-t border-border/50">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                ★ {t("today.upcomingReminders")} ({t("settings.quickLogTitle")})
              </span>
              <p className="text-[11px] text-muted-foreground">{t("settings.quickLogDesc")}</p>
              <div className="flex flex-wrap gap-1.5">
                {SYMPTOMS.filter((s) => !s.safety).map((s) => {
                  const isFav = (record.settings?.quickLogFavorites || []).includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleQuickLogFavorite(s.id)}
                      className={cx(
                        "inline-flex items-center gap-1 rounded-xl px-2.5 py-1 text-xs font-bold transition-all border",
                        isFav
                          ? "bg-accent text-accent-foreground border-accent shadow-xs"
                          : "bg-background border-border text-muted-foreground hover:bg-muted",
                      )}
                    >
                      <span>{isFav ? "★" : "☆"}</span>
                      <span>{t(`sym.${s.id}`)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Symptoms Input & Retirement */}
            <div className="pt-3 border-t border-border/50 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t("set.customSymptoms")}
              </span>
              <form onSubmit={addCustomSymptom} className="flex gap-2">
                <input
                  type="text"
                  maxLength={40}
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder={t("set.customPh")}
                  className={cx(inputCls, "h-11 rounded-2xl text-xs")}
                />
                <Btn type="submit" size="sm" className="rounded-2xl px-4">
                  <Plus className="h-4 w-4 me-1" />
                  {t("common.add")}
                </Btn>
              </form>

              {(record.settings?.customSymptoms || []).length > 0 && (
                <div className="grid gap-2 sm:grid-cols-2 pt-1">
                  {record.settings.customSymptoms.map((cs) => (
                    <div
                      key={cs.id}
                      className={cx(
                        "flex items-center justify-between gap-2 rounded-2xl border p-2.5 text-xs transition-all",
                        cs.retired
                          ? "bg-muted/30 border-border/50 opacity-60"
                          : "bg-card border-border shadow-xs",
                      )}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-semibold text-foreground truncate">{cs.label}</span>
                        {cs.retired && (
                          <span className="text-[10px] font-bold rounded-md bg-muted px-1.5 py-0.5 text-muted-foreground">
                            {t("sym.retired")}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => toggleRetireCustomSymptom(cs.id)}
                          className="text-[11px] font-semibold text-primary hover:underline px-1.5 py-0.5"
                        >
                          {cs.retired ? t("sym.reactivate") : t("sym.retire")}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeCustomSymptom(cs.id)}
                          className="text-muted-foreground hover:text-destructive p-1"
                          title={t("common.delete")}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PRIVACY & SECURITY */}
      {activeTab === "privacy" && (
        <div className="space-y-6 animate-fade-in">
          {/* Saheli Experience & Age Adaptation */}
          <div className="nova-card-elevated p-5 sm:p-6 space-y-4">
            <ExperienceAndAgeSection />
          </div>

          {/* Saheli Serial Identity */}
          <div className="nova-card-elevated p-5 sm:p-6 space-y-4">
            <SerialIdentityCard />
          </div>

          {/* PIN / Vault Lock Management */}
          <div className="nova-card-elevated p-5 sm:p-6 space-y-4">
            <AppLockSection />
          </div>

          {/* Saheli Partner Connect */}
          <div className="nova-card-elevated p-5 sm:p-6 space-y-4">
            <PartnerConnectCard />
          </div>

          {/* Discreet Mode Configuration */}
          <div className="nova-card-elevated p-5 sm:p-6 space-y-3">
            <Toggle
              label={t("set.discreet")}
              desc={t("set.discreetDesc")}
              checked={prefs.discreet}
              onChange={(v) => setPrefs({ discreet: v })}
            />
          </div>

          {/* Shared Phone Privacy Guide */}
          <div className="nova-card-elevated p-5 sm:p-6 space-y-3">
            <h2 className="font-bold text-sm sm:text-base text-foreground">{t("guide.title")}</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">{t("guide.intro")}</p>
            <div className="space-y-2 pt-2 border-t border-border/50 text-xs">
              <div className="rounded-2xl bg-muted/40 p-3 space-y-1">
                <span className="font-bold text-foreground">{t("guide.storage")}</span>
                <p className="text-muted-foreground leading-relaxed">{t("guide.storageDesc")}</p>
              </div>
              <div className="rounded-2xl bg-muted/40 p-3 space-y-1">
                <span className="font-bold text-foreground">{t("guide.clearing")}</span>
                <p className="text-muted-foreground leading-relaxed">{t("guide.clearingDesc")}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DATA, BACKUP & DANGER ZONE */}
      {activeTab === "data" && (
        <div className="space-y-6 animate-fade-in">
          {/* Export Records */}
          <div className="nova-card-elevated p-5 sm:p-6 space-y-3">
            <div>
              <h2 className="font-bold text-sm sm:text-base text-foreground">{t("set.export")}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{t("set.exportDesc")}</p>
            </div>
            <ExportBlock />
          </div>

          {/* Import Records */}
          <div className="nova-card-elevated p-5 sm:p-6 space-y-3">
            <div>
              <h2 className="font-bold text-sm sm:text-base text-foreground">{t("set.import")}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{t("set.importDesc")}</p>
            </div>

            <label className="flex min-h-[48px] cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-muted/30 px-4 text-xs font-bold text-primary hover:bg-muted transition-all">
              <Upload className="h-4 w-4" />
              <span>{t("set.chooseFile")}</span>
              <input
                type="file"
                accept=".json,.csv,.pdf,.html,text/csv,text/html,application/json"
                onChange={handleFile}
                className="sr-only"
              />
            </label>

            {importErr && (
              <p
                role="alert"
                className="rounded-xl bg-destructive/10 p-2 text-xs font-semibold text-destructive"
              >
                {t(importErr)}
              </p>
            )}

            {importState && (
              <div className="space-y-3 rounded-2xl border border-border/70 bg-muted/40 p-4 text-xs animate-fade-in">
                <p className="font-bold text-foreground">{t("set.importPreview")}</p>
                <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                  <div>
                    <span>{t("set.previewDays")}: </span>
                    <strong className="text-foreground">{importState.preview.incomingDays}</strong>
                  </div>
                  <div>
                    <span>{t("set.previewConflicts")}: </span>
                    <strong className="text-foreground">{importState.preview.conflicts}</strong>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
                  <Btn size="sm" onClick={() => applyImport("merge")}>
                    {t("set.importMerge")}
                  </Btn>
                  <Btn size="sm" variant="outline" onClick={() => applyImport("replace")}>
                    {t("set.importReplace")}
                  </Btn>
                  <Btn size="sm" variant="ghost" onClick={() => setImportState(null)}>
                    {t("common.cancel")}
                  </Btn>
                </div>
              </div>
            )}
          </div>

          {/* Demo Controls */}
          <div className="nova-card-elevated p-5 sm:p-6 space-y-3">
            <h2 className="font-bold text-sm sm:text-base text-foreground">
              {isDemo ? t("set.demoActive") : t("set.tryDemo")}
            </h2>
            <p className="text-xs text-muted-foreground">
              {isDemo ? t("set.demoActiveDesc") : t("set.tryDemoDesc")}
            </p>
            <div className="pt-1">
              {isDemo ? (
                <Btn variant="outline" className="rounded-2xl text-xs font-bold" onClick={exitDemo}>
                  {t("set.exitDemo")}
                </Btn>
              ) : (
                <Btn
                  variant="outline"
                  className="rounded-2xl text-xs font-bold"
                  disabled={Object.keys(record.days).length > 0}
                  onClick={tryDemo}
                >
                  <RefreshCw className="h-3.5 w-3.5 me-1.5" />
                  {t("set.startDemo")}
                </Btn>
              )}
            </div>
          </div>

          {/* Danger Zone: Wipe All Data */}
          <div className="rounded-3xl border border-destructive/30 bg-destructive/5 p-5 space-y-3">
            <div>
              <h2 className="font-bold text-sm text-destructive">{t("set.wipe")}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{t("set.wipeDesc")}</p>
            </div>
            {!confirmWipe ? (
              <Btn
                variant="outline"
                className="rounded-2xl border-destructive/40 text-destructive hover:bg-destructive/10 text-xs font-bold"
                onClick={() => setConfirmWipe(true)}
              >
                <Trash2 className="h-3.5 w-3.5 me-1.5" />
                {t("set.wipeBtn")}
              </Btn>
            ) : (
              <div className="space-y-2 rounded-2xl bg-destructive/10 p-3 text-xs animate-fade-in">
                <p className="font-bold text-destructive">{t("set.wipeConfirm")}</p>
                <div className="flex gap-2 pt-1">
                  <Btn
                    size="sm"
                    className="bg-destructive hover:bg-destructive/90 text-white"
                    onClick={wipeAllData}
                  >
                    {t("set.wipeYes")}
                  </Btn>
                  <Btn size="sm" variant="ghost" onClick={() => setConfirmWipe(false)}>
                    {t("common.cancel")}
                  </Btn>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: HELP & BUG REPORTING */}
      {activeTab === "feedback" && (
        <div className="space-y-6 animate-fade-in">
          <div className="nova-card-elevated p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <MessageSquareWarning className="h-6 w-6 text-primary" />
              <div>
                <h2 className="font-bold text-base text-foreground">{t("feedback.centerTitle")}</h2>
                <p className="text-xs text-muted-foreground">{t("feedback.centerSubtitle")}</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("feedback.centerDesc")}
            </p>

            <div className="pt-2">
              <Link
                to="/feedback"
                className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition-all"
              >
                <span>{t("feedback.openReporter")}</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
