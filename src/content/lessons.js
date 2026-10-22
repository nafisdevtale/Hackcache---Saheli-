import { CONDITIONS } from "./conditions.js";
import { FIRST_PERIOD } from "./firstPeriod.js";

// Each paragraph carries its own source id (see sources.js).
export const LESSONS = [
  {
    id: "cycle",
    title: { en: "Your menstrual cycle and its phases", hi: "आपका मासिक चक्र और उसके हिस्से" },
    illustration: "cycle",
    paras: [
      { en: "A cycle starts on the first day of your period and ends the day before the next one. For most adults it is 21 to 35 days; the average is about 28.", hi: "चक्र पीरियड के पहले दिन से शुरू होता है और अगले पीरियड से एक दिन पहले खत्म होता है। ज़्यादातर बड़ों में यह 21 से 35 दिन का होता है; औसत लगभग 28 दिन।", src: "nhs_periods" },
      { en: "Phases: the period (bleeding, usually 2–7 days); the time when an egg gets ready; ovulation (release of an egg, about 10–16 days before the next period); and the days before the next period.", hi: "हिस्से: पीरियड (खून आना, आमतौर पर 2–7 दिन); अंडा तैयार होने का समय; ओव्यूलेशन (अंडाशय से अंडा निकलना, अगले पीरियड से लगभग 10–16 दिन पहले); और अगले पीरियड से पहले के दिन।", src: "nhs_fertility" },
      { en: "In teenagers, cycles of 21 to 45 days are common in the first years after periods start.", hi: "किशोरियों में, पीरियड शुरू होने के बाद के शुरुआती सालों में 21 से 45 दिन का चक्र आम है।", src: "acog_adolescent" },
    ],
  },
  {
    id: "normal",
    title: { en: "What's common, and what needs a doctor", hi: "क्या आम है, और कब डॉक्टर को दिखाएँ" },
    illustration: "check",
    paras: [
      { en: "Common: some cramps, mood changes, tiredness or acne before or during a period, and cycles that vary by a few days.", hi: "आम बातें: पीरियड से पहले या दौरान थोड़ा पेट दर्द, मूड बदलना, थकान या मुँहासे, और चक्र में कुछ दिनों का फ़र्क।", src: "nhs_pms" },
      { en: "See a doctor if periods last more than 7 days, you change a pad every 1–2 hours, you pass clots bigger than a ₹10 coin, or bleed between periods or after sex.", hi: "डॉक्टर को दिखाएँ अगर पीरियड 7 दिन से ज़्यादा चले, हर 1–2 घंटे में पैड बदलना पड़े, ₹10 के सिक्के से बड़े थक्के (जमा हुआ खून) निकलें, या पीरियड के बीच में या संबंध के बाद खून आए।", src: "nhs_heavy" },
      { en: "Also see a doctor if pain stops you from daily life, or painkillers don't help.", hi: "अगर दर्द की वजह से रोज़ के काम न हो पाएँ, या दर्द की दवा से आराम न मिले, तब भी डॉक्टर को दिखाएँ।", src: "nhs_pain" },
    ],
  },
  { id: "pcos", title: CONDITIONS.pcos.title, illustration: "ovary", paras: CONDITIONS.pcos.paras },
  {
    id: "late",
    title: { en: "Why might a period be late?", hi: "पीरियड देर से क्यों आ सकता है?" },
    illustration: "clock",
    paras: [
      { en: "Periods can be late or stop because of stress, sudden weight loss or gain, too much exercise, illness, travel, or pregnancy.", hi: "तनाव, अचानक वज़न घटने या बढ़ने, बहुत ज़्यादा कसरत, बीमारी, सफ़र, या गर्भावस्था की वजह से पीरियड देर से आ सकता है या रुक सकता है।", src: "nhs_missed" },
      { en: "Health conditions such as PCOS or thyroid problems can also cause late or missed periods. A doctor can check with simple tests.", hi: "पीसीओएस या थायरॉइड (गले की एक ग्रंथि) की समस्या से भी पीरियड देर से आ सकता है या छूट सकता है। डॉक्टर आसान जाँच से पता लगा सकते हैं।", src: "nhs_missed" },
      { en: "If you could be pregnant, take a pregnancy test. If you have no period for 3 months and are not pregnant, see a doctor.", hi: "अगर गर्भ ठहरने की संभावना है तो प्रेगनेंसी टेस्ट करें। अगर 3 महीने से पीरियड नहीं आया और आप गर्भवती नहीं हैं, तो डॉक्टर को दिखाएँ।", src: "nhs_missed" },
    ],
  },
  {
    id: "cramps",
    title: { en: "Cramps: what may help", hi: "पेट दर्द: क्या मदद कर सकता है" },
    illustration: "heat",
    paras: [
      { en: "Period pain happens when the muscles of the womb tighten. It is common and often worst in the first days.", hi: "पीरियड का दर्द तब होता है जब गर्भाशय (बच्चेदानी) की मांसपेशियाँ सिकुड़ती हैं। यह आम है और अक्सर शुरू के दिनों में ज़्यादा होता है।", src: "nhs_pain" },
      { en: "Things that may help: a hot water bottle on the tummy, a warm bath, gentle exercise like walking or yoga, and gentle tummy massage.", hi: "जो मदद कर सकते हैं: पेट पर गरम पानी की बोतल, गुनगुने पानी से नहाना, हल्की कसरत जैसे टहलना या योग, और पेट की हल्की मालिश।", src: "nhs_pain" },
      { en: "Over-the-counter painkillers may help — ask a doctor or pharmacist which is right for you and follow the label. If pain is severe or not helped, see a doctor.", hi: "दुकान पर मिलने वाली दर्द की दवा मदद कर सकती है — डॉक्टर या दवा वाले से पूछें कि आपके लिए कौन-सी ठीक है, और पर्चे पर लिखी बात मानें। दर्द बहुत ज़्यादा हो या आराम न मिले तो डॉक्टर को दिखाएँ।", src: "acog_dysmenorrhea" },
    ],
  },
  {
    id: "products",
    title: { en: "Pads, cups and cloth: safe use", hi: "पैड, कप और कपड़ा: सुरक्षित इस्तेमाल" },
    illustration: "pad",
    paras: [
      { en: "Pads: change every 4–6 hours, or sooner if full. Wash hands before and after.", hi: "पैड: हर 4–6 घंटे में बदलें, या भर जाए तो पहले। पहले और बाद में हाथ धोएँ।", src: "nhs_periods" },
      { en: "Cloth pads: wash with soap and clean water, and dry fully in sunlight before using again. Store in a clean, dry place.", hi: "कपड़े के पैड: साबुन और साफ़ पानी से धोएँ, और दोबारा इस्तेमाल से पहले धूप में पूरी तरह सुखाएँ। साफ़ और सूखी जगह रखें।", src: "mohfw_mhs" },
      { en: "Menstrual cups: wash before and after use and boil between periods. Tampons should be changed every 4–8 hours to lower the rare risk of toxic shock syndrome, a serious infection.", hi: "मेंस्ट्रुअल कप: इस्तेमाल से पहले और बाद में धोएँ, और दो पीरियड के बीच उबालें। टैम्पॉन हर 4–8 घंटे में बदलें, ताकि टॉक्सिक शॉक सिंड्रोम (एक दुर्लभ पर गंभीर संक्रमण) का ख़तरा कम हो।", src: "nhs_tss" },
    ],
  },
  FIRST_PERIOD,
];
