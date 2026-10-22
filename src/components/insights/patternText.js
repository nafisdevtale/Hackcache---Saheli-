export function patternText(p, t) {
  if (p.type === "earlySymptom") return t("ins.patternEarly", { sym: t(`sym.${p.symptom}`), n: p.n, total: p.total });
  if (p.type === "lowEnergyBefore") return t("ins.patternEnergy", { n: p.n, total: p.total });
  if (p.type === "painDay1") return t("ins.patternPain", { n: p.n, total: p.total });
  return "";
}
