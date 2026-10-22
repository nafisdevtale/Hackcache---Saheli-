import { useState } from "react";
import { Phone } from "lucide-react";
import { useApp } from "@/App.jsx";
import { Btn, Card, PageTitle, Sources, inputCls, Chip } from "@/components/common/ui.jsx";
import { FAQ, SUGGESTED, matchFaq } from "@/content/faq.js";

export default function Ask() {
  const { t, L } = useApp();
  const [q, setQ] = useState("");
  const [res, setRes] = useState(null);
  const ask = (text) => setRes(matchFaq(text));
  const showItem = (item) => setRes({ type: "match", item, hits: [] });
  return (
    <div className="space-y-4">
      <PageTitle sub={t("ask.intro")}>{t("ask.title")}</PageTitle>
      <p className="rounded-xl bg-muted p-3 text-sm">{t("ask.notAi")}</p>
      <form onSubmit={(e) => { e.preventDefault(); ask(q); }} className="space-y-2">
        <label htmlFor="q" className="font-semibold">{t("ask.label")}</label>
        <input id="q" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("ask.ph")} className={inputCls} maxLength={300} />
        <Btn type="submit" className="w-full">{t("ask.submit")}</Btn>
      </form>
      <div aria-live="polite">
        {res?.type === "selfharm" && (
          <Card className="border-l-8 border-l-urgent">
            <p>{t("ask.selfharm")}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <a href="tel:14416" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-primary px-4 font-semibold text-primary-foreground"><Phone aria-hidden className="h-5 w-5" /> 14416</a>
              <a href="tel:112" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-urgent px-4 font-semibold text-urgent-foreground"><Phone aria-hidden className="h-5 w-5" /> 112</a>
            </div>
            <Sources ids={["telemanas", "india_112"]} />
          </Card>
        )}
        {res?.type === "none" && <Card><p className="text-lg font-semibold">{t("ask.none")}</p></Card>}
        {res?.type === "match" && (
          <Card>
            <h2 className="text-lg font-bold">{L(res.item.q)}</h2>
            <p className="mt-1">{L(res.item.a)}</p>
            {res.item.concerning && <p className="mt-2 rounded-lg bg-secondary p-2 text-secondary-foreground">{t("ask.seekHelp")}</p>}
            {res.hits.length > 0 && <p className="mt-2 text-sm text-muted-foreground">{t("ask.matched", { k: res.hits.join(", ") })}</p>}
            <Sources ids={res.item.src} />
          </Card>
        )}
      </div>
      <section>
        <h2 className="mb-2 font-bold">{t("ask.suggested")}</h2>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED.map((id) => FAQ.find((f) => f.id === id)).map((f) => <Chip key={f.id} onClick={() => showItem(f)}>{L(f.q)}</Chip>)}
        </div>
      </section>
      <details className="rounded-2xl border border-border bg-card p-4">
        <summary className="min-h-12 cursor-pointer font-bold">{t("ask.allFaq", { n: FAQ.length })}</summary>
        <ul className="mt-2 space-y-1">{FAQ.map((f) => <li key={f.id}><button type="button" className="min-h-12 text-left underline" onClick={() => showItem(f)}>{L(f.q)}</button></li>)}</ul>
      </details>
    </div>
  );
}
