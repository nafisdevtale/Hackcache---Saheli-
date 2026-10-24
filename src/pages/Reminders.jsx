import { useState } from "react";
import {
  Bell,
  Clock,
  Pill,
  ShieldCheck,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { useApp } from "@/App.jsx";
import { Btn, PageTitle, Toggle, inputCls, Status } from "@/components/common/ui.jsx";

export default function Reminders() {
  const { t, record, update, fire, prefs } = useApp();
  const r = record.reminders;
  const [note, setNote] = useState("");
  const [med, setMed] = useState({ name: "", time: "08:00" });

  const save = (patch) => update((rec) => ({ ...rec, reminders: { ...rec.reminders, ...patch } }));

  async function setNotify(on) {
    if (!on) return save({ notify: false });
    if (typeof Notification === "undefined") {
      setNote(t("rem.unsupported"));
      return save({ notify: false });
    }
    let perm = Notification.permission;
    if (perm === "default") perm = await Notification.requestPermission();
    if (perm !== "granted") {
      setNote(t("rem.denied"));
      return save({ notify: false });
    }
    setNote("");
    save({ notify: true });
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-border/60 pb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-primary">
          Notifications & Alerts
        </span>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          {t("rem.title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t("rem.intro")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Master Notification & Automated Reminders */}
        <div className="lg:col-span-6 space-y-4">
          {/* Master Notification Toggle */}
          <div className="bloom-card p-5 sm:p-6 space-y-3">
            <Toggle
              label={t("rem.notify")}
              desc={t("rem.notifyDesc")}
              checked={r.notify}
              onChange={setNotify}
            />
            <Status msg={note} tone="err" />
            <div className="rounded-2xl bg-muted/50 p-3 text-xs text-muted-foreground flex items-center gap-2 border border-border/40">
              <ShieldCheck className="h-4 w-4 text-secondary-strong shrink-0" />
              <span>{t("rem.closedNote")}</span>
            </div>
          </div>

          {/* Quiet Hours Card */}
          <div className="bloom-card p-5 sm:p-6 space-y-3">
            <Toggle
              label={t("rem.quietHours")}
              desc={t("rem.quietHoursDesc")}
              checked={r.quietHours?.on || false}
              onChange={(v) =>
                save({
                  quietHours: {
                    ...(r.quietHours || { start: "22:00", end: "07:00" }),
                    on: v,
                  },
                })
              }
            />
            {r.quietHours?.on && (
              <div className="pt-2 grid grid-cols-2 gap-3 border-t border-border/40 animate-fade-in">
                <div>
                  <label
                    htmlFor="quiet-start"
                    className="block text-[11px] font-semibold text-muted-foreground mb-1"
                  >
                    {t("rem.quietHoursStart")}
                  </label>
                  <input
                    id="quiet-start"
                    type="time"
                    className="w-full rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground"
                    value={r.quietHours?.start || "22:00"}
                    onChange={(e) =>
                      save({
                        quietHours: {
                          ...(r.quietHours || { on: true, end: "07:00" }),
                          start: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div>
                  <label
                    htmlFor="quiet-end"
                    className="block text-[11px] font-semibold text-muted-foreground mb-1"
                  >
                    {t("rem.quietHoursEnd")}
                  </label>
                  <input
                    id="quiet-end"
                    type="time"
                    className="w-full rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground"
                    value={r.quietHours?.end || "07:00"}
                    onChange={(e) =>
                      save({
                        quietHours: {
                          ...(r.quietHours || { on: true, start: "22:00" }),
                          end: e.target.value,
                        },
                      })
                    }
                  />
                </div>
              </div>
            )}
          </div>

          {/* Automated Cycle & Habit Reminders */}
          <div className="bloom-card p-5 sm:p-6 space-y-4">
            <h2 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
              Cycle & Daily Nudges
            </h2>

            {/* Next Period Alert */}
            <div className="pb-3 border-b border-border/50">
              <Toggle
                label={t("rem.nextPeriod")}
                desc="Gentle heads-up 2 days before your predicted cycle window"
                checked={r.nextPeriod}
                onChange={(v) => save({ nextPeriod: v })}
              />
            </div>

            {/* Daily Logging Nudge */}
            <div className="pb-3 border-b border-border/50 space-y-2">
              <Toggle
                label={t("rem.daily")}
                desc="Daily reminder to log flow, symptoms, or mood"
                checked={r.daily.on}
                onChange={(v) => save({ daily: { ...r.daily, on: v } })}
              />
              {r.daily.on && (
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">{t("rem.time")}</span>
                  <input
                    type="time"
                    className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground"
                    value={r.daily.time}
                    onChange={(e) => save({ daily: { ...r.daily, time: e.target.value } })}
                  />
                </div>
              )}
            </div>

            {/* Custom Reminder */}
            <div className="space-y-2">
              <Toggle
                label={t("rem.custom")}
                desc="Create a custom personal health notification"
                checked={r.custom.on}
                onChange={(v) => save({ custom: { ...r.custom, on: v } })}
              />
              {r.custom.on && (
                <div className="pt-2 space-y-3 bg-muted/30 p-3 rounded-2xl border border-border/40">
                  <div>
                    <label
                      htmlFor="custom-reminder-text"
                      className="block text-xs font-semibold text-foreground mb-1"
                    >
                      {t("rem.customText")}
                    </label>
                    <input
                      id="custom-reminder-text"
                      className={inputCls}
                      maxLength={80}
                      value={r.custom.text}
                      onChange={(e) => save({ custom: { ...r.custom, text: e.target.value } })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">{t("rem.time")}</span>
                    <input
                      type="time"
                      className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground"
                      value={r.custom.time}
                      onChange={(e) => save({ custom: { ...r.custom, time: e.target.value } })}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Test Notification Action */}
          <div className="pt-1">
            <Btn
              variant="outline"
              className="w-full text-xs font-semibold min-h-11"
              onClick={() => fire("rem.msg.daily")}
            >
              <Bell className="h-4 w-4 me-2" />
              {t("rem.test")}
            </Btn>
          </div>
        </div>

        {/* Right Column: Medications & Supplements */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bloom-card p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pill className="h-5 w-5 text-primary" />
                <h2 className="font-display font-bold text-base text-foreground">
                  {t("rem.meds")}
                </h2>
              </div>
              <span className="text-xs font-semibold text-muted-foreground">
                {r.medicines.length} Active
              </span>
            </div>

            {/* List of active medicines */}
            {r.medicines.length === 0 ? (
              <p className="text-xs text-muted-foreground py-3 text-center">
                No medication or supplement reminders scheduled.
              </p>
            ) : (
              <ul className="space-y-2">
                {r.medicines.map((m, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-muted/50 p-3 border border-border/40"
                  >
                    <div className="space-y-0.5">
                      <p className="font-bold text-xs text-foreground">
                        {prefs.discreet ? "•••" : m.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {m.time}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => save({ medicines: r.medicines.filter((_, j) => j !== i) })}
                      className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-xl hover:bg-card"
                      aria-label={t("rem.remove")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* Add Medicine Form */}
            <form
              className="pt-3 border-t border-border/50 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                if (!med.name.trim()) return setNote(t("rem.medNameReq"));
                save({
                  medicines: [
                    ...r.medicines,
                    { name: med.name.trim().slice(0, 60), time: med.time },
                  ],
                });
                setMed({ name: "", time: med.time });
              }}
            >
              <div>
                <label
                  htmlFor="med-name"
                  className="block text-xs font-semibold text-foreground mb-1"
                >
                  {t("rem.medName")}
                </label>
                <input
                  id="med-name"
                  className={inputCls}
                  placeholder="e.g., Iron supplement, Folic acid, Meftal"
                  value={med.name}
                  maxLength={60}
                  onChange={(e) => setMed({ ...med, name: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-between">
                <label htmlFor="med-time" className="text-xs font-semibold text-foreground">
                  {t("rem.time")}
                </label>
                <input
                  id="med-time"
                  type="time"
                  className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground"
                  value={med.time}
                  onChange={(e) => setMed({ ...med, time: e.target.value })}
                />
              </div>

              <Btn type="submit" variant="secondary" className="w-full text-xs font-bold min-h-11">
                <Plus className="h-4 w-4 me-1.5" />
                {t("rem.addMed")}
              </Btn>
            </form>
          </div>

          {/* Privacy Note */}
          <div className="rounded-3xl border border-border/70 bg-hero p-5 shadow-soft space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Discreet Notifications on Shared Devices</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              When discreet mode is active in Settings, all reminder push messages use neutral,
              private titles such as "Health Check-in" rather than revealing cycle or period details
              on your lock screen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
