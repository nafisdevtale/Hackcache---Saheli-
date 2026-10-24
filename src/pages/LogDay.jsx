import { useEffect, useState } from "react";
import { useSearch, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, CircleDot, Droplet, Check, Trash2, Save } from "lucide-react";
import { useApp } from "@/App.jsx";
import {
  Btn,
  Card,
  Chip,
  PageTitle,
  Toggle,
  Field,
  inputCls,
  Status,
  cx,
} from "@/components/common/ui.jsx";
import { SYMPTOMS, FLOWS, MOODS, ENERGY } from "@/data/symptoms.js";
import { blankDay, validateDay, defaultOvulationObservation } from "@/lib/exportImport.js";
import { addDays, isValidDate } from "@/lib/localDate.js";
import { DailyJournalMotif } from "@/components/brand/SaheliArt.jsx";

export default function LogDay() {
  const {
    t,
    fmt,
    record,
    today,
    saveDay,
    deleteDay,
    saveOvulationObservation,
    deleteOvulationObservation,
  } = useApp();
  const search = useSearch({ strict: false });
  const navigate = useNavigate();
  const initial = isValidDate(search?.date) && search.date <= today ? search.date : today;
  const [date, setDate] = useState(initial);
  const [form, setForm] = useState(() => ({
    ...blankDay(initial),
    ...(record.days[initial] || {}),
  }));
  const [obsForm, setObsForm] = useState(() => ({
    ...defaultOvulationObservation(initial),
    ...(record.ovulationObservations?.[initial] || {}),
  }));
  const [errors, setErrors] = useState([]);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    setDate(initial);
  }, [initial]);

  useEffect(() => {
    setForm({ ...blankDay(date), ...(record.days[date] || {}) });
    setObsForm({
      ...defaultOvulationObservation(date),
      ...(record.ovulationObservations?.[date] || {}),
    });
    setErrors([]);
  }, [date]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (patch) => {
    setForm((f) => ({ ...f, ...patch }));
    setMsg(null);
  };
  const exists = !!record.days[date];
  const [symCategoryFilter, setSymCategoryFilter] = useState("all");

  const customSymptoms = (record.settings?.customSymptoms || [])
    .filter((cs) => !cs.retired || form.symptoms.includes(cs.id))
    .map((cs) => ({
      id: cs.id,
      label: cs.label,
      icon: CircleDot,
      custom: true,
      category: cs.category || "physical",
    }));

  const tracked = [
    ...SYMPTOMS.filter(
      (s) =>
        s.safety || record.settings.trackedSymptoms.includes(s.id) || form.symptoms.includes(s.id),
    ),
    ...customSymptoms,
  ];

  const filteredTracked = tracked.filter((s) => {
    if (symCategoryFilter === "all") return true;
    return s.category === symCategoryFilter;
  });

  const toggleSym = (id) => {
    const isSelected = form.symptoms.includes(id);
    const newSymptoms = isSelected ? form.symptoms.filter((s) => s !== id) : [...form.symptoms, id];
    const newIntensities = { ...(form.symptomIntensities || {}) };
    if (isSelected) {
      delete newIntensities[id];
    } else {
      newIntensities[id] = "moderate";
    }
    set({
      symptoms: newSymptoms,
      symptomIntensities: newIntensities,
    });
  };

  const setIntensity = (id, intensity) => {
    set({
      symptomIntensities: {
        ...(form.symptomIntensities || {}),
        [id]: intensity,
      },
    });
  };

  function go(n) {
    const d = addDays(date, n);
    if (d > today) return;
    setDate(d);
    navigate({ to: "/log", search: { date: d }, replace: true });
  }

  async function onSave(e) {
    e.preventDefault();
    const entry = {
      ...form,
      date,
      flow: form.period ? form.flow : null,
      padHourly: form.period && form.flow === "heavy" ? form.padHourly : null,
      bigClots: form.period && form.flow === "heavy" ? form.bigClots : null,
      symptomIntensities: form.symptomIntensities || {},
      sleep: form.sleep === "" || form.sleep == null ? null : Number(form.sleep),
    };
    const errs = validateDay(entry);
    if (date > today) errs.push("err.future");
    setErrors(errs);
    if (errs.length) return;
    try {
      await saveDay(entry);
      const hasObs =
        (obsForm.testResult && obsForm.testResult !== "none") ||
        obsForm.bbt != null ||
        (obsForm.cervicalFluid && obsForm.cervicalFluid !== "none") ||
        (obsForm.notes && obsForm.notes.trim());

      if (hasObs) {
        await saveOvulationObservation(date, { ...obsForm, date });
      } else if (record.ovulationObservations?.[date]) {
        await deleteOvulationObservation(date);
      }
      setMsg({ key: "log.saved" });
    } catch {
      setMsg({ key: "log.saveFailed", tone: "err" });
    }
  }

  const YesNo = ({ value, onChange, legend }) => (
    <fieldset>
      <legend className="font-semibold text-xs text-foreground mb-1.5">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {[
          [true, "common.yes"],
          [false, "common.no"],
          [null, "common.notSure"],
        ].map(([v, k]) => (
          <Chip key={k} selected={value === v} onClick={() => onChange(v)}>
            {t(k)}
          </Chip>
        ))}
      </div>
    </fieldset>
  );

  return (
    <form onSubmit={onSave} className="space-y-6" noValidate>
      {/* Page Title & Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-3">
        <div className="flex items-center gap-3">
          <DailyJournalMotif className="w-10 h-10 shrink-0" />
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              {t("log.title")}
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {fmt(date, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
            </h1>
          </div>
        </div>

        {/* Date Stepper Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={t("log.prev")}
            onClick={() => go(-1)}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border bg-card hover:bg-muted text-foreground transition-all active:scale-95"
          >
            <ChevronLeft aria-hidden className="h-5 w-5" />
          </button>

          <input
            id="date"
            type="date"
            max={today}
            value={date}
            className="h-10 rounded-2xl border border-border bg-card px-3 text-xs font-semibold text-foreground hover:bg-muted cursor-pointer transition-all"
            onChange={(e) => {
              const d = e.target.value;
              if (isValidDate(d) && d <= today) {
                setDate(d);
                navigate({ to: "/log", search: { date: d }, replace: true });
              }
            }}
          />

          <button
            type="button"
            aria-label={t("log.next")}
            disabled={date >= today}
            onClick={() => go(1)}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border bg-card hover:bg-muted text-foreground disabled:opacity-40 transition-all active:scale-95"
          >
            <ChevronRight aria-hidden className="h-5 w-5" />
          </button>
        </div>
      </div>

      {exists && (
        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
          <Check className="h-3.5 w-3.5" />
          <span>{t("log.editing")}</span>
        </div>
      )}

      {/* Responsive 2-Column Grid on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Period, Flow & Pain */}
        <div className="lg:col-span-6 space-y-4">
          {/* Period & Flow Selector */}
          <div className="bloom-card p-5 sm:p-6 space-y-4">
            <Toggle
              label={t("log.period")}
              checked={form.period}
              onChange={(v) => set({ period: v, flow: v ? form.flow || "medium" : null })}
            />

            {form.period && (
              <fieldset className="pt-3 border-t border-border/50 animate-fade-in space-y-2.5">
                <legend className="font-bold text-xs uppercase tracking-wider text-period">
                  {t("log.flow")}
                </legend>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {FLOWS.map((f) => {
                    const isSelected = form.flow === f;
                    return (
                      <button
                        key={f}
                        type="button"
                        onClick={() => set({ flow: f })}
                        className={cx(
                          "flex flex-col items-center justify-center rounded-2xl py-3 px-2 text-xs font-semibold transition-all border active:scale-95",
                          isSelected
                            ? "bg-period text-period-foreground border-period shadow-sm"
                            : "bg-card border-border/70 hover:bg-period/10 text-foreground",
                        )}
                      >
                        <span className="text-base">
                          {f === "spotting"
                            ? "💧"
                            : f === "light"
                              ? "🩸"
                              : f === "medium"
                                ? "🩸🩸"
                                : "🩸🩸🩸"}
                        </span>
                        <span className="mt-1 font-bold capitalize">{t(`flow.${f}`)}</span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )}

            {form.period && form.flow === "heavy" && (
              <div className="space-y-3 rounded-2xl border border-period/30 bg-period/5 p-4 animate-fade-in">
                <YesNo
                  legend={t("log.padHourly")}
                  value={form.padHourly}
                  onChange={(v) => set({ padHourly: v })}
                />
                <YesNo
                  legend={t("log.bigClots")}
                  value={form.bigClots}
                  onChange={(v) => set({ bigClots: v })}
                />
              </div>
            )}
          </div>

          {/* Pain Slider & Severity */}
          <div className="bloom-card p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <label htmlFor="pain" className="font-bold text-sm text-foreground">
                {t("log.pain")}
              </label>
              <span className="rounded-full bg-primary/10 px-3 py-0.5 text-xs font-bold text-primary">
                {form.pain}/10
              </span>
            </div>

            <p className="text-xs text-muted-foreground">{t("log.painHelp")}</p>

            <input
              id="pain"
              type="range"
              min={0}
              max={10}
              step={1}
              value={form.pain}
              onChange={(e) => set({ pain: Number(e.target.value) })}
              className="h-3 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-primary"
            />

            {form.pain > 0 && (
              <div className="space-y-3 pt-3 border-t border-border/50 animate-fade-in">
                <Toggle
                  label={t("log.painStopped")}
                  checked={form.painStoppedActivities}
                  onChange={(v) => set({ painStoppedActivities: v })}
                />
                <fieldset>
                  <legend className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-2">
                    {t("log.painkiller")}
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {["yes", "no", "na"].map((v) => (
                      <Chip
                        key={v}
                        selected={form.painkillerHelped === v}
                        onClick={() => set({ painkillerHelped: v })}
                      >
                        {t(`pk.${v}`)}
                      </Chip>
                    ))}
                  </div>
                </fieldset>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Symptoms, Mood, Energy, Notes & Extras */}
        <div className="lg:col-span-6 space-y-4">
          {/* Symptoms Chips & Intensity */}
          <div className="bloom-card p-5 sm:p-6 space-y-4">
            <fieldset>
              <legend className="font-bold text-sm text-foreground mb-1">
                {t("log.symptoms")}
              </legend>
              <p className="text-xs text-muted-foreground mb-3">{t("log.symptomsNote")}</p>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap gap-1 mb-3 pb-2 border-b border-border/50">
                {[
                  { id: "all", label: t("learn.catAll") },
                  { id: "physical", label: t("sym.catPhysical") },
                  { id: "emotional", label: t("sym.catEmotional") },
                  { id: "digestive", label: t("sym.catDigestive") },
                  { id: "sleep_energy", label: t("sym.catSleepEnergy") },
                  { id: "safety", label: t("sym.catSafety") },
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSymCategoryFilter(c.id)}
                    className={cx(
                      "text-[11px] font-bold px-2.5 py-1 rounded-full transition-colors",
                      symCategoryFilter === c.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/70 text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              {/* Symptom Selection Chips */}
              <div className="flex flex-wrap gap-1.5">
                {filteredTracked.map((s) => (
                  <Chip
                    key={s.id}
                    icon={s.icon}
                    selected={form.symptoms.includes(s.id)}
                    onClick={() => toggleSym(s.id)}
                  >
                    {s.custom ? s.label : t(`sym.${s.id}`)}
                  </Chip>
                ))}
              </div>
            </fieldset>

            {/* Active Symptom Intensity Selector */}
            {form.symptoms.length > 0 && (
              <div className="pt-3 border-t border-border/50 space-y-2.5 animate-fade-in">
                <span className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                  {t("log.symptoms")} — {t("ins.flowBreakdown")}
                </span>
                <div className="grid gap-2 sm:grid-cols-2">
                  {form.symptoms.map((id) => {
                    const customObj = customSymptoms.find((c) => c.id === id);
                    const label = customObj ? customObj.label : t(`sym.${id}`);
                    const intensity = form.symptomIntensities?.[id] || "moderate";
                    return (
                      <div
                        key={id}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-muted/40 border border-border/60"
                      >
                        <span className="text-xs font-semibold text-foreground truncate max-w-[110px]">
                          {label}
                        </span>
                        <div className="flex gap-1 shrink-0">
                          {[
                            { key: "mild", label: t("sym.intensityMild") },
                            { key: "moderate", label: t("sym.intensityModerate") },
                            { key: "severe", label: t("sym.intensitySevere") },
                          ].map((int) => (
                            <button
                              key={int.key}
                              type="button"
                              onClick={() => setIntensity(id, int.key)}
                              className={cx(
                                "text-[10px] font-bold px-2 py-0.5 rounded-full transition-all active:scale-95",
                                intensity === int.key
                                  ? int.key === "severe"
                                    ? "bg-destructive text-destructive-foreground font-extrabold shadow-xs"
                                    : "bg-primary text-primary-foreground font-extrabold shadow-xs"
                                  : "bg-background text-muted-foreground hover:bg-muted",
                              )}
                            >
                              {int.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Mood & Energy */}
          <div className="bloom-card p-5 sm:p-6 space-y-4">
            <fieldset>
              <legend className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-2">
                {t("log.mood")}
              </legend>
              <div className="flex flex-wrap gap-1.5">
                {MOODS.map((m) => (
                  <Chip
                    key={m}
                    selected={form.mood === m}
                    onClick={() => set({ mood: form.mood === m ? null : m })}
                  >
                    {t(`mood.${m}`)}
                  </Chip>
                ))}
              </div>
            </fieldset>

            <fieldset className="pt-2 border-t border-border/50">
              <legend className="font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-2">
                {t("log.energy")}
              </legend>
              <div className="flex flex-wrap gap-1.5">
                {ENERGY.map((m) => (
                  <Chip
                    key={m}
                    selected={form.energy === m}
                    onClick={() => set({ energy: form.energy === m ? null : m })}
                  >
                    {t(`energy.${m}`)}
                  </Chip>
                ))}
              </div>
            </fieldset>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/50">
              <Field id="sleep" label={t("log.sleep")}>
                <input
                  id="sleep"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={24}
                  step={0.5}
                  value={form.sleep ?? ""}
                  placeholder="e.g. 7.5"
                  onChange={(e) => set({ sleep: e.target.value === "" ? null : e.target.value })}
                  className={inputCls}
                />
              </Field>

              <Field id="meds" label={t("log.medicines")}>
                <input
                  id="meds"
                  type="text"
                  maxLength={300}
                  value={form.medicines}
                  placeholder={t("log.medicinesPh")}
                  onChange={(e) => set({ medicines: e.target.value })}
                  className={inputCls}
                />
              </Field>
            </div>

            {/* Optional Ovulation Observations */}
            <div className="rounded-2xl border border-secondary/30 bg-secondary/5 p-4 space-y-3">
              <span className="font-bold text-xs text-foreground uppercase tracking-wider flex items-center gap-1.5">
                ✨ {t("phase.ovulationCardTitle")} (Optional)
              </span>

              {/* LH Test */}
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-muted-foreground block">
                  {t("phase.lhTest")}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    ["none", "phase.lhNone"],
                    ["negative", "phase.lhNegative"],
                    ["faint", "phase.lhFaint"],
                    ["positive", "phase.lhPositive"],
                  ].map(([id, key]) => (
                    <Chip
                      key={id}
                      selected={obsForm.testResult === id}
                      onClick={() => setObsForm((f) => ({ ...f, testResult: id }))}
                    >
                      {t(key)}
                    </Chip>
                  ))}
                </div>
              </div>

              {/* BBT & Fluid Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field id="bbt" label={t("phase.bbt")}>
                  <div className="flex gap-2">
                    <input
                      id="bbt"
                      type="number"
                      step="0.05"
                      min={obsForm.bbtUnit === "F" ? 95 : 35}
                      max={obsForm.bbtUnit === "F" ? 104 : 41}
                      placeholder={obsForm.bbtUnit === "F" ? "97.8" : "36.6"}
                      value={obsForm.bbt != null ? obsForm.bbt : ""}
                      onChange={(e) =>
                        setObsForm((f) => ({
                          ...f,
                          bbt: e.target.value === "" ? null : parseFloat(e.target.value),
                        }))
                      }
                      className={inputCls}
                    />
                    <div className="flex rounded-xl border border-border overflow-hidden bg-muted/40">
                      <button
                        type="button"
                        onClick={() => setObsForm((f) => ({ ...f, bbtUnit: "C" }))}
                        className={cx(
                          "px-2.5 py-1 text-xs font-bold transition-colors",
                          obsForm.bbtUnit === "C"
                            ? "bg-card text-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        °C
                      </button>
                      <button
                        type="button"
                        onClick={() => setObsForm((f) => ({ ...f, bbtUnit: "F" }))}
                        className={cx(
                          "px-2.5 py-1 text-xs font-bold transition-colors",
                          obsForm.bbtUnit === "F"
                            ? "bg-card text-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        °F
                      </button>
                    </div>
                  </div>
                </Field>

                <Field id="cervicalFluid" label={t("phase.cervicalFluid")}>
                  <select
                    id="cervicalFluid"
                    value={obsForm.cervicalFluid || "none"}
                    onChange={(e) => setObsForm((f) => ({ ...f, cervicalFluid: e.target.value }))}
                    className={inputCls}
                  >
                    <option value="none">{t("phase.fluidDry")}</option>
                    <option value="sticky">{t("phase.fluidSticky")}</option>
                    <option value="creamy">{t("phase.fluidCreamy")}</option>
                    <option value="eggwhite">{t("phase.fluidEggwhite")}</option>
                    <option value="watery">{t("phase.fluidWatery")}</option>
                  </select>
                </Field>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={obsForm.excludedFromCalculations}
                  onChange={(e) =>
                    setObsForm((f) => ({ ...f, excludedFromCalculations: e.target.checked }))
                  }
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-[11px] text-muted-foreground">
                  {t("phase.excludeFromCalc")}
                </span>
              </label>
            </div>

            <Field id="note" label={t("log.note")}>
              <textarea
                id="note"
                rows={3}
                maxLength={2000}
                value={form.note}
                placeholder={t("log.notePh")}
                onChange={(e) => set({ note: e.target.value })}
                className={cx(inputCls, "min-h-20")}
              />
            </Field>
          </div>
        </div>
      </div>

      {errors.length > 0 && (
        <div
          role="alert"
          className="rounded-2xl bg-destructive/10 p-4 text-destructive text-xs space-y-1"
        >
          <p className="font-bold">{t("log.fixErrors")}</p>
          <ul className="ms-5 list-disc">
            {errors.map((e) => (
              <li key={e}>{t(e)}</li>
            ))}
          </ul>
        </div>
      )}

      <Status msg={msg?.key && t(msg.key)} tone={msg?.tone} />

      {/* Floating Sticky Save Bar */}
      <div className="sticky bottom-20 md:bottom-6 z-20 flex gap-3 rounded-2xl border border-primary/20 bg-card/95 p-3.5 shadow-xl backdrop-blur-md">
        <Btn type="submit" className="flex-1 min-h-12 rounded-xl text-base font-bold shadow-md">
          <Save className="h-4 w-4 me-1.5" />
          <span>{t("log.save")}</span>
        </Btn>
        {exists && (
          <Btn
            variant="outline"
            className="min-h-12 rounded-xl border-destructive/40 text-destructive hover:bg-destructive/10"
            onClick={async () => {
              try {
                await deleteDay(date);
                setForm(blankDay(date));
                setMsg({ key: "log.deleted" });
              } catch {
                setMsg({ key: "log.saveFailed", tone: "err" });
              }
            }}
          >
            <Trash2 className="h-4 w-4 me-1.5" />
            <span>{t("common.delete")}</span>
          </Btn>
        )}
      </div>
    </form>
  );
}
