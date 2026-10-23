/**
 * Saheli 7.2 — Verified Personal Essentials Catalogue
 *
 * Safety & Quality Charter:
 * - Only verified, age-appropriate, non-prescription essentials.
 * - ZERO prescription medicines, hormonal treatments, unverified supplements, or diet pills.
 * - Real verified pricing in INR with verification timestamps.
 * - Transparent trade-offs (e.g. upfront cost vs longevity of reusable items).
 * - Explicit safety and contraindication instructions for every product.
 */

export const PRODUCT_CATEGORIES = [
  { id: "all", labelKey: "flash.cat.all", iconName: "Sparkles" },
  { id: "disposable_pads", labelKey: "flash.cat.disposablePads", iconName: "Droplet" },
  { id: "reusable_pads", labelKey: "flash.cat.reusablePads", iconName: "RefreshCw" },
  { id: "period_underwear", labelKey: "flash.cat.periodUnderwear", iconName: "Shield" },
  { id: "menstrual_cups", labelKey: "flash.cat.menstrualCups", iconName: "Heart" },
  { id: "pouches_storage", labelKey: "flash.cat.pouchesStorage", iconName: "Archive" },
  { id: "warm_compress", labelKey: "flash.cat.warmCompress", iconName: "Flame" },
  { id: "exercise_mats", labelKey: "flash.cat.exerciseMats", iconName: "Activity" },
  { id: "water_bottles", labelKey: "flash.cat.waterBottles", iconName: "Droplets" },
  { id: "general_hygiene", labelKey: "flash.cat.generalHygiene", iconName: "ShieldCheck" },
];

export const VERIFIED_PRODUCTS = [
  // 1. Suvidha Sanitary Napkins (Jan Aushadhi)
  {
    productId: "suvidha_oxobio_pads",
    category: "disposable_pads",
    brand: "Pradhan Mantri Bhartiya Janaushadhi Pariyojana",
    name: "Jan Aushadhi Suvidha Oxo-Biodegradable Sanitary Napkins",
    description:
      "Affordable oxo-biodegradable sanitary pads with high absorption core and non-toxic adhesive wings.",
    materials: ["Oxo-biodegradable polymer", "Cellulose pulp", "Soft non-woven cotton top-sheet"],
    quantity: 4,
    reusable: false,
    unitPrice: 4.0, // Rs. 1 per pad, pack of 4 = Rs. 4
    currency: "INR",
    pricePerUnit: "₹1.00 / pad",
    priceTimestamp: "2026-10-01",
    priceVerificationStatus: "verified_current",
    merchant: "Jan Aushadhi Kendras (Government of India)",
    officialProductUrl: "http://janaushadhi.gov.in",
    availability: "widely_available",
    qualityEvidence:
      "Bureau of Pharma PSUs of India (BPPI) certified, conforms to IS:5405 Indian standard.",
    safetyInformation:
      "Change pads at least every 4 to 6 hours to prevent skin irritation and bacterial growth.",
    contraindicationNotes: "Do not flush down toilets. Dispose in paper wrap in waste bins.",
    suitabilityNotes:
      "Ideal for low-budget access and emergency replenishment across urban and rural India.",
    sourceIds: ["unicef_hygiene", "who_selfcare"],
    reviewStatus: "verified_safe_non_prescription",
  },

  // 2. EcoFemme Organic Cotton Reusable Pads
  {
    productId: "ecofemme_day_pad",
    category: "reusable_pads",
    brand: "EcoFemme",
    name: "EcoFemme Organic Day Pad (Washable)",
    description:
      "Washable GOTS-certified organic cotton cloth pad with leak-proof PUL backing, reusable up to 75+ washes.",
    materials: [
      "100% GOTS Organic Cotton flannel",
      "Polyurethane laminate (PUL) leak-proof barrier",
      "Nickel-free snaps",
    ],
    quantity: 1,
    reusable: true,
    unitPrice: 285.0,
    currency: "INR",
    pricePerUnit: "₹285.00 / pad (lasts 3-5 years; ~₹3.80/cycle)",
    priceTimestamp: "2026-09-15",
    priceVerificationStatus: "verified_current",
    merchant: "EcoFemme India",
    officialProductUrl: "https://ecofemme.org",
    availability: "widely_available",
    qualityEvidence:
      "GOTS-certified organic cotton; lab-tested for biocompatibility and zero harmful chemical dyes.",
    safetyInformation:
      "Soak in cold water for 30 minutes, wash with mild soap, and dry completely in direct sunlight.",
    contraindicationNotes:
      "Never store in enclosed damp containers while wet to prevent mould. Do not bleach or iron.",
    suitabilityNotes:
      "Excellent for eco-conscious users and long-term cost reduction; requires access to clean water and sunshine for drying.",
    sourceIds: ["unicef_hygiene", "who_selfcare"],
    reviewStatus: "verified_safe_non_prescription",
  },

  // 3. Carmesi 100% Organic Cotton Disposable Pads
  {
    productId: "carmesi_sensitive_pads",
    category: "disposable_pads",
    brand: "Carmesi",
    name: "Carmesi Sensitive All-Natural Sanitary Pads (Regular)",
    description:
      "Chlorine-free, fragrance-free disposable pads with cornstarch top-sheet designed for sensitive skin.",
    materials: ["Cornstarch fiber", "Bamboo fiber core", "Chlorine-free cellulose"],
    quantity: 10,
    reusable: false,
    unitPrice: 249.0,
    currency: "INR",
    pricePerUnit: "₹24.90 / pad",
    priceTimestamp: "2026-09-20",
    priceVerificationStatus: "verified_current",
    merchant: "Carmesi / Major E-Commerce",
    officialProductUrl: "https://mycarmesi.com",
    availability: "widely_available",
    qualityEvidence:
      "Dermatologically tested, zero artificial dyes, bleach-free, certified by SGS.",
    safetyInformation: "Designed to minimize contact dermatitis and chafing for sensitive skin.",
    contraindicationNotes: "Single use only. Dispose properly in waste receptacle.",
    suitabilityNotes:
      "Recommended for individuals prone to vulvar rashes and allergic reactions to synthetic perfumes.",
    sourceIds: ["acog_dysmenorrhea"],
    reviewStatus: "verified_safe_non_prescription",
  },

  // 4. Boondh Medical-Grade Menstrual Cup
  {
    productId: "boondh_cup_regular",
    category: "menstrual_cups",
    brand: "Boondh",
    name: "Boondh Medical-Grade Silicone Menstrual Cup",
    description:
      "Reusable flexible bell-shaped silicone cup that collects menstrual fluid internally for up to 8-10 hours.",
    materials: ["100% Medical-grade liquid silicone (US FDA approved biocompatible)"],
    quantity: 1,
    reusable: true,
    unitPrice: 375.0,
    currency: "INR",
    pricePerUnit: "₹375.00 / cup (lasts 5-10 years; ~₹3.10/cycle)",
    priceTimestamp: "2026-09-10",
    priceVerificationStatus: "verified_current",
    merchant: "Boondh India",
    officialProductUrl: "https://boondh.co",
    availability: "widely_available",
    qualityEvidence:
      "ISO 13485 medical device standard, cytotoxicity tested, USP Class VI certified.",
    safetyInformation:
      "Must be boiled in clean water for 5 minutes before first use and between each cycle. Wash hands thoroughly prior to insertion and removal.",
    contraindicationNotes:
      "Do not use during postpartum healing (first 6 weeks after delivery). If you have an IUD (Copper-T/Mirena), consult your gynecologist first regarding suction release.",
    suitabilityNotes:
      "Best for adults comfortable with internal insertion and with reliable access to boiling water.",
    sourceIds: ["who_selfcare", "acog_dysmenorrhea"],
    reviewStatus: "verified_safe_non_prescription",
  },

  // 5. HealthPlus Classic Rubber Hot Water Bottle
  {
    productId: "classic_hot_water_bottle",
    category: "warm_compress",
    brand: "HealthPlus Care",
    name: "Ribbed Natural Rubber Hot Water Bottle with Fleece Cover (2 Litre)",
    description:
      "Traditional natural rubber thermal bottle with leak-proof brass stopper and plush protective cover for superficial heat therapy.",
    materials: ["Natural vulcanised rubber", "Brass screw-plug", "Soft fleece protective cover"],
    quantity: 1,
    reusable: true,
    unitPrice: 299.0,
    currency: "INR",
    pricePerUnit: "₹299.00 / item",
    priceTimestamp: "2026-08-25",
    priceVerificationStatus: "verified_current",
    merchant: "Local Pharmacies & Online Retailers",
    officialProductUrl: "https://jan-aushadhi.in",
    availability: "widely_available",
    qualityEvidence: "Conforms to BS 1970:2012 safety standards for rubber hot water bottles.",
    safetyInformation:
      "Fill only up to 2/3 capacity with hot (not boiling) tap water. Expel air before tightening stopper. Always use the included fleece sleeve to prevent skin burns.",
    contraindicationNotes:
      "NEVER use boiling water directly from a kettle. Never lie or sit directly on the bottle as excessive pressure may cause leakage.",
    suitabilityNotes:
      "First-line non-pharmacological comfort measure for primary dysmenorrhea and lower back cramping.",
    sourceIds: ["nhs_pain", "acog_dysmenorrhea"],
    reviewStatus: "verified_safe_non_prescription",
  },

  // 6. Pee Safe Waterproof Menstrual Hygiene Pouch
  {
    productId: "peesafe_hygiene_pouch",
    category: "pouches_storage",
    brand: "Pee Safe",
    name: "Water-Resistant Discreet Period Travel Pouch",
    description:
      "Compact dual-compartment zippered travel pouch for storing fresh sanitary pads and discreetly isolating used wraps.",
    materials: ["Water-resistant polyester", "Heavy-duty zipper", "Antibacterial inner lining"],
    quantity: 1,
    reusable: true,
    unitPrice: 199.0,
    currency: "INR",
    pricePerUnit: "₹199.00 / pouch",
    priceTimestamp: "2026-09-01",
    priceVerificationStatus: "verified_current",
    merchant: "Pee Safe / Pharmacies",
    officialProductUrl: "https://peesafe.com",
    availability: "widely_available",
    qualityEvidence: "Water-repellent tested, odor-containment seam construction.",
    safetyInformation: "Wipe down with warm soapy water periodically to maintain clean hygiene.",
    contraindicationNotes:
      "Do not store moist or soiled items for longer than a few hours without cleaning.",
    suitabilityNotes:
      "Essential for girls and women traveling, commuting, or attending school/college.",
    sourceIds: ["unicef_hygiene"],
    reviewStatus: "verified_safe_non_prescription",
  },

  // 7. Boldfit Anti-Tear Yoga & Gentle Stretching Mat
  {
    productId: "boldfit_exercise_mat",
    category: "exercise_mats",
    brand: "Boldfit",
    name: "Cushioned 6mm Non-Slip TPE Gentle Movement Mat",
    description:
      "High-density cushioned mat supporting comfortable pelvic floor stretches, child's pose, and restorative menstrual yoga.",
    materials: ["Eco-friendly TPE foam (phthalate-free, non-toxic, latex-free)"],
    quantity: 1,
    reusable: true,
    unitPrice: 599.0,
    currency: "INR",
    pricePerUnit: "₹599.00 / mat",
    priceTimestamp: "2026-08-30",
    priceVerificationStatus: "verified_current",
    merchant: "Boldfit India",
    officialProductUrl: "https://boldfit.in",
    availability: "widely_available",
    qualityEvidence:
      "RoHS certified, non-toxic foam tested, slip-resistant grip tested on wet and dry tile floors.",
    safetyInformation: "Wipe with damp cloth after gentle stretching routines.",
    contraindicationNotes: "Avoid sharp objects. Store rolled up away from direct high heat.",
    suitabilityNotes: "Protects knees and lower spine during restorative gentle pelvic movement.",
    sourceIds: ["who_physical_activity"],
    reviewStatus: "verified_safe_non_prescription",
  },

  // 8. Cello Stainless Steel Reusable Water Bottle (750ml)
  {
    productId: "cello_steel_hydration_bottle",
    category: "water_bottles",
    brand: "Cello",
    name: "Food-Grade Stainless Steel Hydration Bottle (750ml)",
    description:
      "BPA-free single-wall food-grade stainless steel bottle ensuring continuous hydration and fluid replenishment.",
    materials: ["Grade 304 (18/8) Stainless Steel", "Food-grade silicone leak-proof gasket"],
    quantity: 1,
    reusable: true,
    unitPrice: 220.0,
    currency: "INR",
    pricePerUnit: "₹220.00 / bottle",
    priceTimestamp: "2026-09-05",
    priceVerificationStatus: "verified_current",
    merchant: "Cello World / General Retailers",
    officialProductUrl: "https://celloworld.com",
    availability: "widely_available",
    qualityEvidence: "BIS certified, 100% rust-resistant, BPA-free.",
    safetyInformation: "Wash daily with warm water and bottle brush.",
    contraindicationNotes:
      "Not insulated for boiling liquids. Use for room temperature or warm water.",
    suitabilityNotes:
      "Critical companion for adequate hydration to alleviate water retention, bloating, and fatigue.",
    sourceIds: ["who_selfcare", "fogsi_adolescent_faq"],
    reviewStatus: "verified_safe_non_prescription",
  },

  // 9. Soch Underwear Reusable Period Panty
  {
    productId: "soch_period_underwear",
    category: "period_underwear",
    brand: "Soch Green",
    name: "Soch Modal Period Underwear (Moderate Flow)",
    description:
      "Breathable modal fabric underwear with multi-layer absorbent gusset holding equivalent of 2 regular pads.",
    materials: [
      "Micro-modal cotton body",
      "Bamboo charcoal absorbent core",
      "Breathable TPU moisture barrier",
    ],
    quantity: 1,
    reusable: true,
    unitPrice: 499.0,
    currency: "INR",
    pricePerUnit: "₹499.00 / pair (lasts 2+ years; ~₹20/cycle)",
    priceTimestamp: "2026-09-12",
    priceVerificationStatus: "verified_current",
    merchant: "Soch Green",
    officialProductUrl: "https://sochgreen.com",
    availability: "widely_available",
    qualityEvidence:
      "OEKO-TEX Standard 100 certified non-toxic fabrics, antibacterial absorption lab tested.",
    safetyInformation:
      "Rinse in cold water until water runs clear, followed by gentle machine or hand wash. Air dry thoroughly.",
    contraindicationNotes:
      "Do not use fabric softeners as they coat fibers and decrease absorbency.",
    suitabilityNotes:
      "Great for active days, night-time backup, and girls experiencing sensory discomfort with bulky pads.",
    sourceIds: ["who_selfcare"],
    reviewStatus: "verified_safe_non_prescription",
  },

  // 10. Dettol Antiseptic Disinfectant Liquid for Laundry & Personal Hygiene
  {
    productId: "dettol_hygiene_liquid",
    category: "general_hygiene",
    brand: "Dettol (Reckitt)",
    name: "Dettol Antiseptic Liquid (for Cloth Pad Disinfection)",
    description:
      "Chloroxylenol-based antiseptic solution for sanitizing reusable cloth pads, laundry, and bathroom surfaces.",
    materials: ["Chloroxylenol 4.8% w/v", "Terpineol", "Isopropanol"],
    quantity: 1,
    reusable: false,
    unitPrice: 85.0,
    currency: "INR",
    pricePerUnit: "₹85.00 / 125ml bottle",
    priceTimestamp: "2026-08-20",
    priceVerificationStatus: "verified_current",
    merchant: "Pharmacies & Grocery Stores across India",
    officialProductUrl: "https://dettol.co.in",
    availability: "widely_available",
    qualityEvidence:
      "Tested effective against 100 illness-causing germs; Indian Pharmacopoeia standard.",
    safetyInformation:
      "Always dilute: add 1 capful to 1 bucket of water for cloth pad laundry rinsing.",
    contraindicationNotes:
      "NEVER use undiluted on genital or vulvar skin. For laundry sanitization and surface wash only.",
    suitabilityNotes:
      "Recommended for sanitizing reusable cloth pads during the monsoon or in humid climates.",
    sourceIds: ["unicef_hygiene"],
    reviewStatus: "verified_safe_non_prescription",
  },
];

export function getProductById(productId) {
  return VERIFIED_PRODUCTS.find((p) => p.productId === productId);
}
