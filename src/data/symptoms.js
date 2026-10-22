import { Zap, Brain, Sparkles, CircleDot, BatteryLow, Shuffle, Moon, Activity, Heart, Waves, RotateCw, Wind, TriangleAlert, Droplets, Droplet, Siren, Scissors, Cloud } from "lucide-react";

// Labels live in i18n as "sym.<id>". `safety: true` symptoms are always shown
// in the log form because safety rules depend on them.
export const SYMPTOMS = [
  { id: "cramps", icon: Zap },
  { id: "headache", icon: Brain },
  { id: "acne", icon: Sparkles },
  { id: "bloating", icon: CircleDot },
  { id: "tiredness", icon: BatteryLow },
  { id: "mood_changes", icon: Shuffle },
  { id: "trouble_sleeping", icon: Moon },
  { id: "back_pain", icon: Activity },
  { id: "breast_tenderness", icon: Heart },
  { id: "nausea", icon: Waves },
  { id: "excess_hair", icon: Scissors },
  { id: "discharge_change", icon: Cloud },
  { id: "dizziness", icon: RotateCw, safety: true },
  { id: "breathless", icon: Wind, safety: true },
  { id: "fainting", icon: TriangleAlert, safety: true },
  { id: "bleeding_between", icon: Droplets, safety: true },
  { id: "bleeding_after_sex", icon: Droplet, safety: true },
  { id: "sudden_severe_pain", icon: Siren, safety: true },
];
export const SYMPTOM_IDS = SYMPTOMS.map((s) => s.id);
export const FLOWS = ["spotting", "light", "medium", "heavy"];
export const MOODS = ["great", "good", "okay", "low", "very_low"];
export const ENERGY = ["low", "medium", "high"];
