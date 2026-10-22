import { useEffect, useState } from "react";
import { useSearch, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useApp } from "@/App.jsx";
import { Btn, Card, Chip, PageTitle, Toggle, Field, inputCls, Status, cx } from "@/components/common/ui.jsx";
import { SYMPTOMS, FLOWS, MOODS, ENERGY } from "@/data/symptoms.js";
import { blankDay, validateDay } from "@/lib/exportImport.js";
import { addDays, isValidDate } from "@/lib/localDate.js";

export default function LogDay() {
  const { t, fmt, record, today, saveDay, deleteDay } = useApp();
  const search = useSearch({ strict: false });
  const navigate = useNavigate();
  const initial = isValidDate(search?.date) && search.date <= today ? search.date : today;
  const [date, setDate] = useState(initial);
  const [form, setForm] = useState(() => ({ ...blankDay(initial), ...(record.days[initial] || {}) }));
  const [errors, setErrors] = useState([]);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    setDate(initial);
  }, [initial]);

  useEffect(() => {
    setForm({ ...blankDay(date), ...(record.days[date] || {}) });
    setErrors([]);
  }, [date]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (patch) => { setForm((f) => ({ ...f, ...patch })); setMsg(null); };
  const exists = !!record.days[date];
  const tracked = SYMPTOMS.filter((s) => s.safety || record.settings.trackedSymptoms.includes(s.id) || form.symptoms.includes(s.id));
  const toggleSym = (id) => set({ symptoms: form.symptoms.includes(id) ? form.symptoms.filter((s) => s !== id) : [...form.symptoms, id] });

  function go(n) {
    const d = addDays(date, n);
    if (d > today) return;
    setDate(d);
    navigate({ to: "/log", search: { date: d }, replace: true });
  }

  async function onSave(e) {
    e.preventDefault();
    const entry = {
      ...form, date,
      flow: form.period ? form.flow : null,
      padHourly: form.period && form.flow === "heavy" ? form.padHourly : null,
      bigClots: form.period && form.flow === "heavy" ? form.bigClots : null,
      sleep: form.sleep === "" || form.sleep == null ? null : Number(form.sleep),
    };
    const errs = validateDay(entry);
    if (date > today) errs.push("err.future");
    setErrors(errs);
    if (errs.length) return;
    try { await saveDay(entry); setMsg({ key: "log.saved" }); }
    catch { setMsg({ key: "log.saveFailed", tone: "err" }); }
  }

  const YesNo = ({ value, onChange, legend }) => (
    <fieldset>
      <legend className="font-semibold">{legend}</legend>
      <div className="mt-1 flex flex-wrap gap-2">
        {[[true, "common.yes"], [false, "common.no"], [null, "common.notSure"]].map(([v, k]) => (
          <Chip key={k} selected={value === v} onClick={() => onChange(v)}>{t(k)}</Chip>
        ))}
      </div>
    </fieldset>
  );

  return (
    <form onSubmit={onSave} className="space-y-4" noValidate>
      <PageTitle>{t("log.title")}</PageTitle>
      <Card>
        <div className="flex items-end gap-2">
          <button type="button" aria-label={t("log.prev")} onClick={() => go(-1)} className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-border"><ChevronLeft aria-hidden /></button>
          <div className="flex-1">
            <Field id="date" label={t("log.date")}>
              <input id="date" type="date" max={today} value={date} className={inputCls}
                onChange={(e) => { const d = e.target.value; if (isValidDate(d) && d <= today) { setDate(d); navigate({ to: "/log", search: { date: d }, replace: true }); } }} />
            </Field>
          </div>
          <button type="button" aria-label={t("log.next")} disabled={date >= today} onClick={() => go(1)} className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-border disabled:opacity-40"><ChevronRight aria-hidden /></button>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{fmt(date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
        {exists && <p className="mt-1 text-sm font-semibold">{t("log.editing")}</p>}
      </Card>

      <Card className="space-y-3">
        <Toggle label={t("log.period")} checked={form.period} onChange={(v) => set({ period: v, flow: v ? form.flow || "medium" : null })} />
        {form.period && (
          <fieldset>
            <legend className="font-semibold">{t("log.flow")}</legend>
            <div className="mt-1 flex flex-wrap gap-2">
              {FLOWS.map((f) => <Chip key={f} selected={form.flow === f} onClick={() => set({ flow: f })}>{t(`flow.${f}`)}</Chip>)}
            </div>
          </fieldset>
        )}
        {form.period && form.flow === "heavy" && (
          <div className="space-y-3 rounded-xl bg-muted p-3">
            <YesNo legend={t("log.padHourly")} value={form.padHourly} onChange={(v) => set({ padHourly: v })} />
            <YesNo legend={t("log.bigClots")} value={form.bigClots} onChange={(v) => set({ bigClots: v })} />
          </div>
        )}
      </Card>

      <Card className="space-y-3">
        <Field id="pain" label={`${t("log.pain")}: ${form.pain}/10`} hint={t("log.painHelp")}>
          <input id="pain" type="range" min={0} max={10} step={1} value={form.pain} onChange={(e) => set({ pain: Number(e.target.value) })} className="h-12 w-full accent-primary" />
        </Field>
        {form.pain > 0 && (
          <>
            <Toggle label={t("log.painStopped")} checked={form.painStoppedActivities} onChange={(v) => set({ painStoppedActivities: v })} />
            <fieldset>
              <legend className="font-semibold">{t("log.painkiller")}</legend>
              <div className="mt-1 flex flex-wrap gap-2">
                {["yes", "no", "na"].map((v) => <Chip key={v} selected={form.painkillerHelped === v} onClick={() => set({ painkillerHelped: v })}>{t(`pk.${v}`)}</Chip>)}
              </div>
            </fieldset>
          </>
        )}
      </Card>

      <Card>
        <fieldset>
          <legend className="text-lg font-bold">{t("log.symptoms")}</legend>
          <p className="text-sm text-muted-foreground">{t("log.symptomsNote")}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {tracked.map((s) => <Chip key={s.id} icon={s.icon} selected={form.symptoms.includes(s.id)} onClick={() => toggleSym(s.id)}>{t(`sym.${s.id}`)}</Chip>)}
          </div>
        </fieldset>
      </Card>

      <Card className="space-y-3">
        <fieldset>
          <legend className="font-semibold">{t("log.mood")}</legend>
          <div className="mt-1 flex flex-wrap gap-2">
            {MOODS.map((m) => <Chip key={m} selected={form.mood === m} onClick={() => set({ mood: form.mood === m ? null : m })}>{t(`mood.${m}`)}</Chip>)}
          </div>
        </fieldset>
        <fieldset>
          <legend className="font-semibold">{t("log.energy")}</legend>
          <div className="mt-1 flex flex-wrap gap-2">
            {ENERGY.map((m) => <Chip key={m} selected={form.energy === m} onClick={() => set({ energy: form.energy === m ? null : m })}>{t(`energy.${m}`)}</Chip>)}
          </div>
        </fieldset>
        <Field id="sleep" label={t("log.sleep")}>
          <input id="sleep" type="number" inputMode="decimal" min={0} max={24} step={0.5} value={form.sleep ?? ""} onChange={(e) => set({ sleep: e.target.value === "" ? null : e.target.value })} className={inputCls} />
        </Field>
        <Field id="meds" label={t("log.medicines")}>
          <input id="meds" type="text" maxLength={300} value={form.medicines} placeholder={t("log.medicinesPh")} onChange={(e) => set({ medicines: e.target.value })} className={inputCls} />
        </Field>
        <Field id="note" label={t("log.note")}>
          <textarea id="note" rows={3} maxLength={2000} value={form.note} placeholder={t("log.notePh")} onChange={(e) => set({ note: e.target.value })} className={cx(inputCls, "min-h-24")} />
        </Field>
      </Card>

      {errors.length > 0 && (
        <div role="alert" className="rounded-xl bg-destructive/10 p-3 text-destructive">
          <p className="font-semibold">{t("log.fixErrors")}</p>
          <ul className="ml-5 list-disc">{errors.map((e) => <li key={e}>{t(e)}</li>)}</ul>
        </div>
      )}
      <Status msg={msg?.key && t(msg.key)} tone={msg?.tone} />
      <div className="sticky bottom-20 z-10 flex gap-2 bg-background/90 py-2">
        <Btn type="submit" className="flex-1 text-lg">{t("log.save")}</Btn>
        {exists && <Btn variant="outline" onClick={async () => { try { await deleteDay(date); setForm(blankDay(date)); setMsg({ key: "log.deleted" }); } catch { setMsg({ key: "log.saveFailed", tone: "err" }); } }}>{t("common.delete")}</Btn>}
      </div>
    </form>
  );
}
