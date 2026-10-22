export const PREGNANCY_WEEKS = [
  { from: 0, to: 8, src: "nhs_weekbyweek", en: "Early weeks. Many people feel tired or sick. Register with a health centre or ANM early for check-ups and folic acid advice.", hi: "शुरुआती हफ़्ते। कई लोगों को थकान या उल्टी जैसा लगता है। जाँच और फ़ोलिक एसिड की सलाह के लिए जल्दी स्वास्थ्य केंद्र या एएनएम के पास नाम लिखवाएँ।" },
  { from: 9, to: 13, src: "nhs_weekbyweek", en: "The first scan is often offered around this time. Sickness often eases by week 14.", hi: "इस समय के आसपास अक्सर पहला स्कैन होता है। उल्टी जैसा लगना अक्सर 14वें हफ़्ते तक कम हो जाता है।" },
  { from: 14, to: 19, src: "nhs_weekbyweek", en: "Many people feel more energy. Your bump may start to show.", hi: "कई लोगों को ज़्यादा ताकत महसूस होती है। पेट दिखना शुरू हो सकता है।" },
  { from: 20, to: 27, src: "nhs_weekbyweek", en: "You may start to feel the baby move. A detailed scan is often around 20 weeks.", hi: "आपको बच्चे की हलचल महसूस होने लग सकती है। लगभग 20वें हफ़्ते के आसपास अक्सर एक विस्तृत स्कैन होता है।" },
  { from: 28, to: 35, src: "nhs_movements", en: "Get to know your baby's pattern of movements. If movements slow down or stop, contact a doctor straight away — don't wait.", hi: "बच्चे की हलचल का अपना तरीका पहचानें। अगर हलचल कम हो जाए या रुक जाए, तो तुरंत डॉक्टर से संपर्क करें — इंतज़ार न करें।" },
  { from: 36, to: 42, src: "nhs_weekbyweek", en: "Your baby could arrive any time from now. Plan how you will reach the hospital; 108 can help with ambulance transport.", hi: "अब कभी भी बच्चा आ सकता है। सोच लें कि अस्पताल कैसे पहुँचेंगी; एम्बुलेंस के लिए 108 मदद कर सकता है।" },
];

// WHO 2016: at least 8 antenatal contacts.
export const CHECKUP_WEEKS = [12, 20, 26, 30, 34, 36, 38, 40];

export const PREGNANCY_WARNINGS = [
  { id: "bleeding", src: "nhs_preg_bleeding" },
  { id: "pain", src: "nhs_preg_bleeding" },
  { id: "headache", src: "nhs_preg_urgent" },
  { id: "swelling", src: "nhs_preg_urgent" },
  { id: "fever", src: "nhs_weekbyweek" },
  { id: "fluid", src: "nhs_weekbyweek" },
  { id: "movement", src: "nhs_movements" },
];
