import { useState } from "react";
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
  Check,
  Plus,
  RefreshCw,
  FileText,
  Volume2,
  Bell,
  MessageSquareWarning,
  Play,
  Stethoscope,
  HeartPulse,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useApp } from "@/App.jsx";
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
import { SYMPTOMS } from "@/data/symptoms.js";
import {
  exportJSON,
  exportCSV,
  parseImport,
  importPreview,
  parseCSVImport,
  generateDoctorSummaryPDF,
  parsePDFImport,
  defaultHealthConditions,
} from "@/lib/exportImport.js";
import { QUESTIONNAIRE_CONDITIONS, CONFIRMATION_STATUSES } from "@/content/conditions.js";
import { loadChimeSettings, saveChimeSettings, playSaheliChime } from "@/lib/chime.js";
import { isValidPin, isValidPassphrase, isValidSecret } from "@/lib/encryption.js";
import { todayStr } from "@/lib/localDate.js";
import { LANGUAGES } from "@/i18n/languages.js";

function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
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
                  download(`${base}.csv`, exportCSV(record), "text/csv");
                } else if (pending === "pdf") {
                  download(
                    `${base}-health-summary.html`,
                    generateDoctorSummaryPDF(record, analysis),
                    "text/html",
                  );
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

function PinSection() {
  const { t, meta, enablePin, disablePin, changePin, lock } = useApp();
  const [mode, setMode] = useState(null);
  const [secretType, setSecretType] = useState("pin"); // "pin" | "passphrase"
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [c, setC] = useState("");
  const [ok, setOk] = useState(false);
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const enabled = !!meta.pin?.enabled;
  const reset = () => {
    setA("");
    setB("");
    setC("");
    setMode(null);
    setOk(false);
    setMsg(null);
  };

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      if (mode === "enable") {
        const isValid = secretType === "passphrase" ? isValidPassphrase(a) : isValidPin(a);
        if (!isValid)
          throw new Error(secretType === "passphrase" ? "set.passphraseInvalid" : "set.pinInvalid");
        if (a !== b) throw new Error("set.pinMismatch");
        await enablePin(a);
        reset();
      } else if (mode === "disable") {
        if (!isValidSecret(a)) throw new Error("set.pinInvalid");
        await disablePin(a);
        reset();
      } else if (mode === "change") {
        if (!isValidSecret(a)) throw new Error("set.pinInvalid");
        const isValid = secretType === "passphrase" ? isValidPassphrase(b) : isValidPin(b);
        if (!isValid)
          throw new Error(secretType === "passphrase" ? "set.passphraseInvalid" : "set.pinInvalid");
        if (b !== c) throw new Error("set.pinMismatch");
        await changePin(a, b);
        reset();
      }
    } catch (err) {
      setMsg({ key: err.message || "set.failed", tone: "err" });
    }
    setBusy(false);
  }

  const isPass = secretType === "passphrase";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-bold text-sm text-foreground">{t("set.pin")}</h3>
          <p className="text-xs text-muted-foreground">
            {enabled ? t("set.pinOn") : t("set.pinOff")}
          </p>
        </div>
        {enabled && (
          <Btn size="sm" variant="outline" className="rounded-xl text-xs font-bold" onClick={lock}>
            <Lock className="h-3 w-3 me-1" />
            {t("set.lockNow")}
          </Btn>
        )}
      </div>

      {!mode && (
        <div className="flex flex-wrap gap-2 pt-1">
          {!enabled ? (
            <Btn size="sm" className="rounded-xl" onClick={() => setMode("enable")}>
              {t("set.pinEnable")}
            </Btn>
          ) : (
            <>
              <Btn
                size="sm"
                variant="outline"
                className="rounded-xl"
                onClick={() => setMode("change")}
              >
                {t("set.pinChange")}
              </Btn>
              <Btn
                size="sm"
                variant="outline"
                className="rounded-xl"
                onClick={() => setMode("disable")}
              >
                {t("set.pinDisable")}
              </Btn>
            </>
          )}
        </div>
      )}

      {mode && (
        <form
          onSubmit={submit}
          className="space-y-3 rounded-2xl border border-border/70 bg-muted/30 p-4 animate-fade-in"
        >
          {(mode === "enable" || mode === "change") && (
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-card border border-border/60 w-fit text-xs">
              <button
                type="button"
                onClick={() => {
                  setSecretType("pin");
                  setA("");
                  setB("");
                  setC("");
                }}
                className={cx(
                  "px-3 py-1 font-bold rounded-lg transition-all",
                  secretType === "pin"
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t("set.secretTypePin")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSecretType("passphrase");
                  setA("");
                  setB("");
                  setC("");
                }}
                className={cx(
                  "px-3 py-1 font-bold rounded-lg transition-all",
                  secretType === "passphrase"
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t("set.secretTypePassphrase")}
              </button>
            </div>
          )}

          {mode === "enable" && (
            <>
              <PinInput
                id="new"
                label={isPass ? t("set.passphraseNew") : t("set.pinNew")}
                value={a}
                onChange={setA}
                isPassphrase={isPass}
              />
              <PinInput
                id="confirm"
                label={isPass ? t("set.passphraseConfirm") : t("set.pinConfirm")}
                value={b}
                onChange={setB}
                isPassphrase={isPass}
              />
              <label className="flex items-start gap-2 text-xs text-muted-foreground cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={ok}
                  onChange={(e) => setOk(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-border text-primary"
                />
                <span>{t("set.pinWarn")}</span>
              </label>
            </>
          )}
          {mode === "disable" && (
            <PinInput
              id="curr"
              label={t("set.pinCurrent")}
              value={a}
              onChange={setA}
              isPassphrase={true}
            />
          )}
          {mode === "change" && (
            <>
              <PinInput
                id="curr"
                label={t("set.pinCurrent")}
                value={a}
                onChange={setA}
                isPassphrase={true}
              />
              <PinInput
                id="new"
                label={isPass ? t("set.passphraseNew") : t("set.pinNew")}
                value={b}
                onChange={setB}
                isPassphrase={isPass}
              />
              <PinInput
                id="confirm"
                label={isPass ? t("set.passphraseConfirm") : t("set.pinConfirm")}
                value={c}
                onChange={setC}
                isPassphrase={isPass}
              />
            </>
          )}
          <div className="flex gap-2 pt-2">
            <Btn type="submit" disabled={busy || (mode === "enable" && !ok)}>
              {busy ? t("set.working") : t("common.save")}
            </Btn>
            <Btn type="button" variant="outline" onClick={reset}>
              {t("common.cancel")}
            </Btn>
          </div>
          <Status msg={msg?.key && t(msg.key)} tone={msg?.tone} />
        </form>
      )}
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
    <div className="space-y-6">
      <div className="border-b border-border/60 pb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-primary">
          {prefs.discreet ? t("app.discreetName") : t("app.name")}
        </span>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          {t("set.title")}
        </h1>
      </div>

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
          <div className="bloom-card p-5 sm:p-6 space-y-4">
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
          </div>

          {/* Theme, Text Size & Accessibility */}
          <div className="bloom-card p-5 sm:p-6 space-y-4">
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
          <div className="bloom-card p-5 sm:p-6 space-y-4">
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
                onClick={() =>
                  playSaheliChime({
                    volume: chimeSettings.volume,
                    reducedSensory: chimeSettings.reducedSensory,
                    discreetMode: prefs.discreet,
                  })
                }
                className="flex items-center gap-1.5 rounded-xl text-xs font-bold"
              >
                <Play className="h-3.5 w-3.5 text-primary" />
                <span>{t("chime.preview")}</span>
              </Btn>
            </div>

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
          <div className="bloom-card p-5 sm:p-6 space-y-4">
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
          <div className="bloom-card p-5 sm:p-6 space-y-4">
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
          <div className="bloom-card p-5 sm:p-6 space-y-5">
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
                ★ {t("today.upcomingReminders")} (Quick Log)
              </span>
              <p className="text-[11px] text-muted-foreground">
                Select your favorite symptoms for instant 1-tap logging.
              </p>
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
                          title="Delete"
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
          {/* PIN Lock Management */}
          <div className="bloom-card p-5 sm:p-6 space-y-4">
            <PinSection />
          </div>

          {/* Discreet Mode Configuration */}
          <div className="bloom-card p-5 sm:p-6 space-y-3">
            <Toggle
              label={t("set.discreet")}
              desc={t("set.discreetDesc")}
              checked={prefs.discreet}
              onChange={(v) => setPrefs({ discreet: v })}
            />
          </div>

          {/* Shared Phone Privacy Guide */}
          <div className="bloom-card p-5 sm:p-6 space-y-3">
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
          <div className="bloom-card p-5 sm:p-6 space-y-3">
            <div>
              <h2 className="font-bold text-sm sm:text-base text-foreground">{t("set.export")}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{t("set.exportDesc")}</p>
            </div>
            <ExportBlock />
          </div>

          {/* Import Records */}
          <div className="bloom-card p-5 sm:p-6 space-y-3">
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
          <div className="bloom-card p-5 sm:p-6 space-y-3">
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
          <div className="bloom-card p-6 space-y-4">
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
