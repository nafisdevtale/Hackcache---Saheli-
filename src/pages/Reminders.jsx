import { useState } from "react";
import { useApp } from "@/App.jsx";
import { Btn, Card, PageTitle, Toggle, inputCls, Status } from "@/components/common/ui.jsx";

export default function Reminders() {
  const { t, record, update, fire, prefs } = useApp();
  const r = record.reminders;
  const [note, setNote] = useState("");
  const [med, setMed] = useState({ name: "", time: "08:00" });
  const save = (patch) => update((rec) => ({ ...rec, reminders: { ...rec.reminders, ...patch } }));

  async function setNotify(on) {
    if (!on) return save({ notify: false });
    if (typeof Notification === "undefined") { setNote(t("rem.unsupported")); return save({ notify: false }); }
    let perm = Notification.permission;
    if (perm === "default") perm = await Notification.requestPermission();
    if (perm !== "granted") { setNote(t("rem.denied")); return save({ notify: false }); }
    setNote("");
    save({ notify: true });
  }

  return (
    <div className="space-y-4">
      <PageTitle sub={t("rem.intro")}>{t("rem.title")}</PageTitle>
      <p className="rounded-xl bg-muted p-3 text-sm">{t("rem.closedNote")}</p>
      <Card>
        <Toggle label={t("rem.notify")} desc={t("rem.notifyDesc")} checked={r.notify} onChange={setNotify} />
        <Status msg={note} tone="err" />
      </Card>
      <Card className="divide-y divide-border">
        <Toggle label={t("rem.nextPeriod")} checked={r.nextPeriod} onChange={(v) => save({ nextPeriod: v })} />
        <div className="py-2">
          <Toggle label={t("rem.daily")} checked={r.daily.on} onChange={(v) => save({ daily: { ...r.daily, on: v } })} />
          {r.daily.on && <label className="block">{t("rem.time")}<input type="time" className={inputCls} value={r.daily.time} onChange={(e) => save({ daily: { ...r.daily, time: e.target.value } })} /></label>}
        </div>
        <div className="py-2">
          <Toggle label={t("rem.custom")} checked={r.custom.on} onChange={(v) => save({ custom: { ...r.custom, on: v } })} />
          {r.custom.on && (
            <div className="space-y-2">
              <label className="block">{t("rem.customText")}<input className={inputCls} maxLength={80} value={r.custom.text} onChange={(e) => save({ custom: { ...r.custom, text: e.target.value } })} /></label>
              <label className="block">{t("rem.time")}<input type="time" className={inputCls} value={r.custom.time} onChange={(e) => save({ custom: { ...r.custom, time: e.target.value } })} /></label>
            </div>
          )}
        </div>
      </Card>
      <Card>
        <h2 className="text-lg font-bold">{t("rem.meds")}</h2>
        <ul className="mt-2 space-y-2">
          {r.medicines.map((m, i) => (
            <li key={i} className="flex items-center justify-between gap-2 rounded-xl bg-muted p-2">
              <span>{prefs.discreet ? "•••" : m.name} — {m.time}</span>
              <Btn variant="outline" onClick={() => save({ medicines: r.medicines.filter((_, j) => j !== i) })}>{t("rem.remove")}</Btn>
            </li>
          ))}
        </ul>
        <form className="mt-3 grid gap-2" onSubmit={(e) => { e.preventDefault(); if (!med.name.trim()) return setNote(t("rem.medNameReq")); save({ medicines: [...r.medicines, { name: med.name.trim().slice(0, 60), time: med.time }] }); setMed({ name: "", time: med.time }); }}>
          <label>{t("rem.medName")}<input className={inputCls} value={med.name} maxLength={60} onChange={(e) => setMed({ ...med, name: e.target.value })} /></label>
          <label>{t("rem.time")}<input type="time" className={inputCls} value={med.time} onChange={(e) => setMed({ ...med, time: e.target.value })} /></label>
          <Btn type="submit" variant="secondary">{t("rem.addMed")}</Btn>
        </form>
      </Card>
      <Btn variant="outline" className="w-full" onClick={() => fire("rem.msg.daily")}>{t("rem.test")}</Btn>
    </div>
  );
}
