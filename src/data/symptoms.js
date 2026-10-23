import {
  Zap,
  Brain,
  Sparkles,
  CircleDot,
  BatteryLow,
  Shuffle,
  Moon,
  Activity,
  Heart,
  Waves,
  RotateCw,
  Wind,
  TriangleAlert,
  Droplets,
  Droplet,
  Siren,
  Scissors,
  Cloud,
} from "lucide-react";

// Labels live in i18n as "sym.<id>". `safety: true` symptoms are always shown
// in the log form because safety rules depend on them.
export const SYMPTOMS = [
  { id: "cramps", icon: Zap, category: "physical" },
  { id: "headache", icon: Brain, category: "physical" },
  { id: "acne", icon: Sparkles, category: "physical" },
  { id: "bloating", icon: CircleDot, category: "digestive" },
  { id: "tiredness", icon: BatteryLow, category: "sleep_energy" },
  { id: "mood_changes", icon: Shuffle, category: "emotional" },
  { id: "trouble_sleeping", icon: Moon, category: "sleep_energy" },
  { id: "back_pain", icon: Activity, category: "physical" },
  { id: "breast_tenderness", icon: Heart, category: "physical" },
  { id: "nausea", icon: Waves, category: "digestive" },
  { id: "excess_hair", icon: Scissors, category: "physical" },
  { id: "discharge_change", icon: Cloud, category: "physical" },
  { id: "dizziness", icon: RotateCw, safety: true, category: "safety" },
  { id: "breathless", icon: Wind, safety: true, category: "safety" },
  { id: "fainting", icon: TriangleAlert, safety: true, category: "safety" },
  { id: "bleeding_between", icon: Droplets, safety: true, category: "safety" },
  { id: "bleeding_after_sex", icon: Droplet, safety: true, category: "safety" },
  { id: "sudden_severe_pain", icon: Siren, safety: true, category: "safety" },
];
export const SYMPTOM_IDS = SYMPTOMS.map((s) => s.id);
export const SYMPTOM_CATEGORIES = ["physical", "emotional", "digestive", "sleep_energy", "safety"];
export const SYMPTOM_INTENSITIES = ["mild", "moderate", "severe"];
export const FLOWS = ["spotting", "light", "medium", "heavy"];
export const MOODS = ["great", "good", "okay", "low", "very_low"];
export const ENERGY = ["low", "medium", "high"];
