import { useState } from "react";
import { useApp } from "@/App.jsx";
import { Btn, Card, PageTitle, Toggle, Chip, inputCls, Status } from "@/components/common/ui.jsx";
import { SYMPTOMS } from "@/data/symptoms.js";
import { exportJSON, exportCSV, parseImport, importPreview } from "@/lib/exportImport.js";
import { isValidPin } from "@/lib/encryption.js";
import { todayStr } from "@/lib/localDate.js";

function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function PinInput({ id, label, value, onChange }) {
  return (
    <label htmlFor={id} className="block font-semibold">
      {label}
      <input
        id={id}
        type="password"
        inputMode="numeric"
        maxLength={4}
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
        className={inputCls}
      />
    </label>
  );
}

function ExportBlock() {
  const { t, record, prefs } = useApp();
  const [pending, setPending] = useState(null);
  const base = `${prefs.discreet ? "diary" : "saheli"}-${todayStr()}`;
  return (
    <div className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-2">
        <Btn variant="outline" onClick={() => setPending("json")}>
          {t("set.exportJson")}
        </Btn>
        <Btn variant="outline" onClick={() => setPending("csv")}>
          {t("set.exportCsv")}
        </Btn>
      </div>
      {pending && (
        <div
          role="alertdialog"
          aria-label={t("set.exportWarn")}
          className="rounded-xl bg-accent p-3 text-accent-foreground"
        >
          <p>{t("set.exportWarn")}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Btn
              onClick={() => {
                pending === "json"
                  ? download(`${base}.json`, exportJSON(record), "application/json")
                  : download(`${base}.csv`, exportCSV(record), "text/csv");
                setPending(null);
              }}
            >
              {t("set.exportConfirm")}
            </Btn>
            <Btn variant="outline" onClick={() => setPending(null)}>
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
    setOk(false);
    setMode(null);
  };
  async function run(fn, success) {
    setBusy(true);
    setMsg({ text: t("set.working") });
    try {
      await fn();
      setMsg({ text: t(success) });
      reset();
    } catch (e) {
      setMsg({
        text: t(e?.name === "OperationError" ? "set.pinWrong" : "set.failed"),
        tone: "err",
      });
    }
    setBusy(false);
  }
  return (
    <div className="space-y-3">
      <p className="font-semibold">{enabled ? t("set.pinOn") : t("set.pinOff")}</p>
      {!enabled && mode !== "enable" && (
        <Btn onClick={() => setMode("enable")}>{t("set.pinEnable")}</Btn>
      )}
      {mode === "enable" && (
        <div className="space-y-2 rounded-xl bg-muted p-3">
          <p className="font-semibold">{t("set.pinWarn")}</p>
          <p>{t("set.pinExportFirst")}</p>
          <ExportBlock />
          <PinInput id="p1" label={t("set.pinNew")} value={a} onChange={setA} />
          <PinInput id="p2" label={t("set.pinConfirm")} value={b} onChange={setB} />
          <label className="flex min-h-12 items-center gap-3">
            <input
              type="checkbox"
              className="h-6 w-6 accent-primary"
              checked={ok}
              onChange={(e) => setOk(e.target.checked)}
            />{" "}
            {t("set.pinUnderstand")}
          </label>
          <div className="flex flex-wrap gap-2">
            <Btn
              disabled={busy || !ok}
              onClick={() => {
                if (!isValidPin(a)) return setMsg({ text: t("set.pinInvalid"), tone: "err" });
                if (a !== b) return setMsg({ text: t("set.pinMismatch"), tone: "err" });
                run(() => enablePin(a), "set.pinEnabled");
              }}
            >
              {t("set.pinEnable")}
            </Btn>
            <Btn variant="outline" onClick={reset}>
              {t("common.cancel")}
            </Btn>
          </div>
        </div>
      )}
      {enabled && !mode && (
        <div className="flex flex-wrap gap-2">
          <Btn variant="outline" onClick={() => setMode("change")}>
            {t("set.pinChange")}
          </Btn>
          <Btn variant="outline" onClick={() => setMode("disable")}>
            {t("set.pinDisable")}
          </Btn>
          <Btn variant="secondary" onClick={lock}>
            {t("set.lockNow")}
          </Btn>
        </div>
      )}
      {mode === "change" && (
        <div className="space-y-2 rounded-xl bg-muted p-3">
          <PinInput id="pc" label={t("set.pinCurrent")} value={c} onChange={setC} />
          <PinInput id="pn" label={t("set.pinNew")} value={a} onChange={setA} />
          <PinInput id="pn2" label={t("set.pinConfirm")} value={b} onChange={setB} />
          <div className="flex flex-wrap gap-2">
            <Btn
              disabled={busy}
              onClick={() => {
                if (!isValidPin(a) || !isValidPin(c))
                  return setMsg({ text: t("set.pinInvalid"), tone: "err" });
                if (a !== b) return setMsg({ text: t("set.pinMismatch"), tone: "err" });
                run(() => changePin(c, a), "set.pinChanged");
              }}
            >
              {t("set.pinChange")}
            </Btn>
            <Btn variant="outline" onClick={reset}>
              {t("common.cancel")}
            </Btn>
          </div>
        </div>
      )}
      {mode === "disable" && (
        <div className="space-y-2 rounded-xl bg-muted p-3">
          <PinInput id="pd" label={t("set.pinCurrent")} value={c} onChange={setC} />
          <div className="flex flex-wrap gap-2">
            <Btn
              disabled={busy}
              onClick={() =>
                isValidPin(c)
                  ? run(() => disablePin(c), "set.pinDisabled")
                  : setMsg({ text: t("set.pinInvalid"), tone: "err" })
              }
            >
              {t("set.pinDisable")}
            </Btn>
            <Btn variant="outline" onClick={reset}>
              {t("common.cancel")}
            </Btn>
          </div>
        </div>
      )}
      <Status msg={msg?.text} tone={msg?.tone} />
    </div>
  );
}

function ImportBlock() {
  const { t, record, importRecord, isDemo } = useApp();
  const [parsed, setParsed] = useState(null);
  const [msg, setMsg] = useState(null);
  if (isDemo) return <p className="text-sm">{t("set.importDemoBlock")}</p>;
  async function onFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const res = parseImport(await file.text());
    if (!res.ok) {
      setParsed(null);
      return setMsg({ text: t(res.error), tone: "err" });
    }
    setMsg(null);
    setParsed({ rec: res.record, preview: importPreview(record, res.record) });
  }
  async function apply(strategy) {
    try {
      await importRecord(parsed.rec, strategy);
      setMsg({ text: t("set.importDone") });
      setParsed(null);
    } catch {
      setMsg({ text: t("set.failed"), tone: "err" });
    }
  }
  return (
    <div className="space-y-2">
      <label className="block font-semibold">
        {t("set.import")}
        <input
          type="file"
          accept="application/json,.json"
          onChange={onFile}
          className={`${inputCls} file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-2`}
        />
      </label>
      {parsed && (
        <div className="rounded-xl bg-muted p-3">
          <p>{t("set.importPreview", parsed.preview)}</p>
          <div className="mt-2 grid gap-2">
            <Btn onClick={() => apply("merge")}>{t("set.importMerge")}</Btn>
            <Btn variant="outline" onClick={() => apply("replace")}>
              {t("set.importReplace")}
            </Btn>
            <Btn variant="ghost" onClick={() => setParsed(null)}>
              {t("common.cancel")}
            </Btn>
          </div>
        </div>
      )}
      <Status msg={msg?.text} tone={msg?.tone} />
    </div>
  );
}

export default function Settings() {
  const app = useApp();
  const { t, prefs, setPrefs, record, update, isDemo, exitDemo, tryDemo, deleteAll } = app;
  const s = record.settings;
  const [confirmDel, setConfirmDel] = useState(false);
  const [failure, setFailure] = useState("");
  const act = async (fn) => {
    try {
      await fn();
      setFailure("");
    } catch {
      setFailure(t("set.failed"));
    }
  };
  const setS = (patch) =>
    act(() => update((r) => ({ ...r, settings: { ...r.settings, ...patch } })));
  const realEmpty = Object.keys(record.days).length === 0;
  return (
    <div className="space-y-4">
      <PageTitle>{t("set.title")}</PageTitle>
      <Status msg={failure} tone="err" />

      <Card className="space-y-3">
        <h2 className="text-lg font-bold">{t("set.display")}</h2>
        <fieldset>
          <legend className="font-semibold">{t("set.language")}</legend>
          <div className="mt-1 flex gap-2">
            {[
              ["en", "English"],
              ["hi", "हिंदी"],
            ].map(([v, l]) => (
              <Chip key={v} selected={prefs.lang === v} onClick={() => setPrefs({ lang: v })}>
                {l}
              </Chip>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="font-semibold">{t("set.textSize")}</legend>
          <div className="mt-1 flex flex-wrap gap-2">
            {["md", "lg", "xl"].map((v) => (
              <Chip
                key={v}
                selected={prefs.textSize === v}
                onClick={() => setPrefs({ textSize: v })}
              >
                {t(`ts.${v}`)}
              </Chip>
            ))}
          </div>
        </fieldset>
        <Toggle
          label={t("set.contrast")}
          checked={prefs.contrast}
          onChange={(v) => setPrefs({ contrast: v })}
        />
        <Toggle
          label={t("set.readAloud")}
          checked={prefs.readAloud}
          onChange={(v) => setPrefs({ readAloud: v })}
        />
      </Card>

      <Card className="space-y-3">
        <h2 className="text-lg font-bold">{t("set.health")}</h2>
        <fieldset>
          <legend className="font-semibold">{t("set.age")}</legend>
          <div className="mt-1 flex flex-wrap gap-2">
            {["under18", "adult"].map((v) => (
              <Chip key={v} selected={s.ageGroup === v} onClick={() => setS({ ageGroup: v })}>
                {t(`age.${v}`)}
              </Chip>
            ))}
          </div>
        </fieldset>
        {s.ageGroup === "adult" ? (
          <Toggle
            label={t("set.fertility")}
            checked={s.showFertility !== false}
            onChange={(v) => setS({ showFertility: v })}
          />
        ) : (
          <>
            <Toggle
              label={t("set.fertility")}
              desc={t("set.fertilityDesc")}
              checked={s.fertilityOptIn}
              onChange={(v) => setS({ fertilityOptIn: v })}
            />
            <Toggle
              label={t("set.pregOptIn")}
              desc={t("set.fertilityDesc")}
              checked={s.pregnancyOptIn}
              onChange={(v) => setS({ pregnancyOptIn: v })}
            />
          </>
        )}
        {s.trackingPaused && !record.pregnancy.active && (
          <div>
            <p>{t("set.tracking")}</p>
            <Btn variant="secondary" onClick={() => setS({ trackingPaused: false })}>
              {t("set.resumeTracking")}
            </Btn>
          </div>
        )}
        <fieldset>
          <legend className="font-semibold">{t("set.symptoms")}</legend>
          <p className="text-sm text-muted-foreground">{t("set.symptomsDesc")}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {SYMPTOMS.filter((x) => !x.safety).map((x) => {
              const on = s.trackedSymptoms.includes(x.id);
              return (
                <Chip
                  key={x.id}
                  icon={x.icon}
                  selected={on}
                  onClick={() =>
                    setS({
                      trackedSymptoms: on
                        ? s.trackedSymptoms.filter((y) => y !== x.id)
                        : [...s.trackedSymptoms, x.id],
                    })
                  }
                >
                  {t(`sym.${x.id}`)}
                </Chip>
              );
            })}
          </div>
        </fieldset>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-lg font-bold">{t("set.privacy")}</h2>
        <h3 className="font-bold">{t("set.pin")}</h3>
        <PinSection />
        <Toggle
          label={t("set.discreet")}
          desc={t("set.discreetDesc")}
          checked={prefs.discreet}
          onChange={(v) => setPrefs({ discreet: v })}
        />
      </Card>

      <Card className="space-y-3">
        <h2 className="text-lg font-bold">{t("set.data")}</h2>
        <ExportBlock />
        <ImportBlock />
      </Card>

      <Card className="space-y-2">
        <h2 className="text-lg font-bold">{t("set.demo")}</h2>
        {isDemo ? (
          <>
            <p>{t("set.demoActive")}</p>
            <Btn onClick={() => act(exitDemo)}>{t("set.exitDemo")}</Btn>
          </>
        ) : realEmpty ? (
          <Btn variant="outline" onClick={() => act(tryDemo)}>
            {t("set.tryDemo")}
          </Btn>
        ) : (
          <p className="text-sm">{t("set.tryDemoBlocked")}</p>
        )}
      </Card>

      <Card className="space-y-2 border-destructive">
        <h2 className="text-lg font-bold text-destructive">{t("set.delete")}</h2>
        <p>{t("set.deleteWarn")}</p>
        {!confirmDel ? (
          <Btn variant="danger" onClick={() => setConfirmDel(true)}>
            {t("set.delete")}
          </Btn>
        ) : (
          <div role="alertdialog" aria-label={t("set.deleteWarn")} className="flex flex-wrap gap-2">
            <Btn variant="danger" onClick={() => act(deleteAll)}>
              {t("set.deleteConfirm")}
            </Btn>
            <Btn variant="outline" onClick={() => setConfirmDel(false)}>
              {t("common.cancel")}
            </Btn>
          </div>
        )}
      </Card>
      <p className="text-sm text-muted-foreground">{t("common.disclaimer")}</p>
    </div>
  );
}
