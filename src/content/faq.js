// Local FAQ. `kw` = matching keywords (English + Hindi + Hinglish). `concerning`
// answers get a "when to seek help" line appended in the UI.
const f = (id, kw, q, a, src, concerning = false) => ({ id, kw, q, a, src, concerning });

export const FAQ = [
  f("normal_length", ["normal", "cycle", "length", "days", "kitne", "din", "चक्र", "सामान्य", "दिन"],
    { en: "How long is a normal cycle?", hi: "सामान्य चक्र कितने दिन का होता है?" },
    { en: "For most adults a cycle is 21–35 days. In teenagers, 21–45 days is common in the first years.", hi: "ज़्यादातर बड़ों में चक्र 21–35 दिन का होता है। किशोरियों में शुरू के सालों में 21–45 दिन आम है।" }, ["nhs_periods", "acog_adolescent"]),
  f("irregular", ["irregular", "anियमित", "अनियमित", "late", "early", "vary", "बदलता"],
    { en: "Are irregular periods normal?", hi: "क्या अनियमित पीरियड सामान्य हैं?" },
    { en: "Irregular periods are common in the first years after periods start and near menopause. Stress, weight change and illness can also cause them. If they stay irregular, a doctor can check why.", hi: "पीरियड शुरू होने के बाद के शुरुआती सालों में और मेनोपॉज़ (पीरियड हमेशा के लिए बंद होने) के पास अनियमित पीरियड आम हैं। तनाव, वज़न बदलना और बीमारी से भी ऐसा होता है। अगर लगातार अनियमित रहें, तो डॉक्टर वजह देख सकते हैं।" }, ["nhs_irregular"], true),
  f("late_reason", ["late", "missed", "delay", "der", "देर", "छूट", "नहीं आया"],
    { en: "Why is my period late?", hi: "मेरा पीरियड देर से क्यों आया?" },
    { en: "Common reasons are stress, weight change, too much exercise, illness, travel, pregnancy, PCOS or thyroid problems. If you could be pregnant, take a test.", hi: "आम वजहें हैं: तनाव, वज़न बदलना, ज़्यादा कसरत, बीमारी, सफ़र, गर्भावस्था, पीसीओएस या थायरॉइड की समस्या। अगर गर्भ ठहरने की संभावना है, तो टेस्ट करें।" }, ["nhs_missed"], true),
  f("pcos_what", ["pcos", "pcod", "पीसीओएस", "पीसीओडी", "polycystic"],
    { en: "What is PCOS or PCOD?", hi: "पीसीओएस या पीसीओडी क्या है?" },
    { en: "PCOS is a common hormone condition that can cause irregular periods, extra hair, acne and weight gain. In India people often say PCOD for the same thing. Only a doctor can diagnose it.", hi: "पीसीओएस हार्मोन से जुड़ी एक आम समस्या है, जिसमें अनियमित पीरियड, ज़्यादा बाल, मुँहासे और वज़न बढ़ना हो सकता है। भारत में लोग अक्सर इसे पीसीओडी भी कहते हैं। इसका पता सिर्फ़ डॉक्टर लगा सकते हैं।" }, ["who_pcos", "nhs_pcos"], true),
  f("pcos_have", ["do i have pcos", "pcos hai", "मुझे पीसीओएस", "test", "जाँच", "diagnose"],
    { en: "Can this app tell me if I have PCOS?", hi: "क्या यह ऐप बता सकता है कि मुझे पीसीओएस है?" },
    { en: "No. Saheli cannot diagnose anything. A doctor uses your history, an examination and sometimes tests. You can show them your Saheli summary.", hi: "नहीं। सहेली कोई बीमारी नहीं पहचान सकती। डॉक्टर आपकी बातें, जाँच और कभी-कभी टेस्ट से पता लगाते हैं। आप उन्हें सहेली का सारांश दिखा सकती हैं।" }, ["who_pcos"], true),
  f("pcos_cure", ["pcos cure", "treatment", "इलाज", "ilaj", "ठीक"],
    { en: "Can PCOS be cured?", hi: "क्या पीसीओएस ठीक हो सकता है?" },
    { en: "There is no cure, but symptoms can be managed with healthy eating, activity and treatment from a doctor.", hi: "इसका पूरा इलाज नहीं है, पर अच्छे खाने, गतिविधि और डॉक्टर के इलाज से लक्षणों को संभाला जा सकता है।" }, ["nhs_pcos"]),
  f("cramps_help", ["cramps", "pain", "dard", "दर्द", "पेट", "ऐंठन", "relief"],
    { en: "What helps with period cramps?", hi: "पीरियड के दर्द में क्या मदद करता है?" },
    { en: "A hot water bottle, a warm bath, gentle exercise and tummy massage may help. Ask a doctor or pharmacist about painkillers.", hi: "गरम पानी की बोतल, गुनगुने पानी से नहाना, हल्की कसरत और पेट की मालिश मदद कर सकते हैं। दर्द की दवा के बारे में डॉक्टर या दवा वाले से पूछें।" }, ["nhs_pain"], true),
  f("pain_severe", ["severe pain", "bahut dard", "बहुत दर्द", "school miss", "can't move"],
    { en: "My pain is so bad I miss school. Is that okay?", hi: "मुझे इतना दर्द होता है कि स्कूल छूट जाता है। क्या यह ठीक है?" },
    { en: "Pain that stops your daily life is not something you have to just put up with. Please see a doctor — it can often be treated.", hi: "जो दर्द रोज़ के काम रोक दे, उसे बस सहते रहना ज़रूरी नहीं। कृपया डॉक्टर को दिखाएँ — अक्सर इसका इलाज हो सकता है।" }, ["nhs_pain", "acog_dysmenorrhea"], true),
  f("heavy", ["heavy", "bleeding", "zyada khoon", "ज़्यादा खून", "भारी", "pad hourly"],
    { en: "How do I know if my bleeding is heavy?", hi: "कैसे जानूँ कि खून ज़्यादा आ रहा है?" },
    { en: "Bleeding may be heavy if you change a pad every 1–2 hours, pass clots bigger than a ₹10 coin, bleed through clothes, or bleed for more than 7 days.", hi: "खून ज़्यादा हो सकता है अगर हर 1–2 घंटे में पैड बदलना पड़े, ₹10 के सिक्के से बड़े थक्के निकलें, कपड़ों पर दाग लग जाए, या 7 दिन से ज़्यादा खून आए।" }, ["nhs_heavy"], true),
  f("clots", ["clot", "clots", "थक्के", "thakke", "jama"],
    { en: "Are clots normal?", hi: "क्या थक्के आना सामान्य है?" },
    { en: "Small clots can happen. Clots bigger than a ₹10 coin may be a sign of heavy bleeding.", hi: "छोटे थक्के आ सकते हैं। ₹10 के सिक्के से बड़े थक्के ज़्यादा खून आने का संकेत हो सकते हैं।" }, ["nhs_heavy"], true),
  f("long_period", ["7 days", "long period", "lamba", "लंबा", "ज़्यादा दिन", "week"],
    { en: "My period lasts more than a week. Should I worry?", hi: "मेरा पीरियड एक हफ़्ते से ज़्यादा चलता है। क्या चिंता करूँ?" },
    { en: "Periods usually last 2–7 days. If yours often last longer, it is a good idea to see a doctor.", hi: "पीरियड आमतौर पर 2–7 दिन चलता है। अगर आपका अक्सर इससे लंबा चलता है, तो डॉक्टर को दिखाना अच्छा है।" }, ["nhs_heavy"], true),
  f("spotting", ["spotting", "between periods", "धब्बे", "बीच में", "dhabbe"],
    { en: "Why do I bleed between periods?", hi: "पीरियड के बीच में खून क्यों आता है?" },
    { en: "Bleeding between periods or after sex should be checked by a doctor, even if it is light.", hi: "पीरियड के बीच या संबंध के बाद खून आए, तो डॉक्टर से जाँच करवानी चाहिए, चाहे थोड़ा ही हो।" }, ["nhs_irregular"], true),
  f("anaemia", ["anaemia", "anemia", "tired", "dizzy", "khoon ki kami", "खून की कमी", "थकान", "चक्कर"],
    { en: "I feel tired and dizzy during heavy periods. Why?", hi: "ज़्यादा खून वाले पीरियड में थकान और चक्कर क्यों आते हैं?" },
    { en: "Heavy periods can lower iron and cause anaemia (low blood/iron), which can make you tired, breathless or dizzy. A simple blood test at a health centre can check this.", hi: "ज़्यादा खून जाने से शरीर में आयरन कम हो सकता है और एनीमिया (खून की कमी) हो सकता है, जिससे थकान, साँस फूलना या चक्कर आ सकते हैं। स्वास्थ्य केंद्र पर खून की आसान जाँच से इसका पता चल सकता है।" }, ["nhs_anaemia"], true),
  f("first_age", ["first period", "pehla", "पहला", "age", "उम्र", "start"],
    { en: "When do periods usually start?", hi: "पीरियड आमतौर पर कब शुरू होते हैं?" },
    { en: "Usually between ages 10 and 16. If there is no period by 15, see a doctor.", hi: "आमतौर पर 10 से 16 साल के बीच। अगर 15 साल तक पीरियड न आए, तो डॉक्टर को दिखाएँ।" }, ["nhs_starting", "acog_adolescent"]),
  f("pad_change", ["pad", "change", "बदलें", "पैड", "how often"],
    { en: "How often should I change my pad?", hi: "पैड कितनी बार बदलना चाहिए?" },
    { en: "Every 4–6 hours, or sooner if it is full. Wash your hands before and after.", hi: "हर 4–6 घंटे में, या भर जाए तो पहले। पहले और बाद में हाथ धोएँ।" }, ["nhs_periods"]),
  f("cloth", ["cloth", "kapda", "कपड़ा", "reuse", "धोना"],
    { en: "Is it safe to use cloth?", hi: "क्या कपड़ा इस्तेमाल करना सुरक्षित है?" },
    { en: "Yes, if it is clean. Wash with soap and clean water and dry fully in sunlight before using again.", hi: "हाँ, अगर साफ़ हो। साबुन और साफ़ पानी से धोएँ और दोबारा इस्तेमाल से पहले धूप में पूरी तरह सुखाएँ।" }, ["mohfw_mhs"]),
  f("cup", ["cup", "menstrual cup", "कप"],
    { en: "Can I use a menstrual cup?", hi: "क्या मैं मेंस्ट्रुअल कप इस्तेमाल कर सकती हूँ?" },
    { en: "Many people use cups safely. Wash it before and after use and boil it between periods. Follow the maker's instructions.", hi: "कई लोग कप सुरक्षित तरीके से इस्तेमाल करते हैं। इस्तेमाल से पहले और बाद में धोएँ और दो पीरियड के बीच उबालें। बनाने वाली कंपनी के निर्देश मानें।" }, ["nhs_periods"]),
  f("bath", ["bath", "nahana", "नहाना", "wash hair", "बाल धोना"],
    { en: "Can I bathe or wash my hair during my period?", hi: "क्या पीरियड में नहा सकती हूँ या बाल धो सकती हूँ?" },
    { en: "Yes. Bathing is safe and helps you stay clean and comfortable. A warm bath may also ease cramps.", hi: "हाँ। नहाना सुरक्षित है और साफ़ व आरामदायक रहने में मदद करता है। गुनगुने पानी से नहाने से दर्द भी कम हो सकता है।" }, ["nhs_pain"]),
  f("exercise", ["exercise", "sports", "khel", "खेल", "कसरत", "yoga", "योग"],
    { en: "Can I exercise or play sports during my period?", hi: "क्या पीरियड में कसरत या खेल सकती हूँ?" },
    { en: "Yes. Gentle exercise like walking, swimming or yoga may even help with cramps.", hi: "हाँ। टहलना, तैरना या योग जैसी हल्की कसरत दर्द में मदद भी कर सकती है।" }, ["nhs_pain"]),
  f("food", ["eat", "food", "khana", "खाना", "sour", "खट्टा", "achar"],
    { en: "Should I avoid certain foods during my period?", hi: "क्या पीरियड में कुछ खाने से बचना चाहिए?" },
    { en: "There is no need to avoid sour food or pickle. Eat a balanced diet with iron-rich foods like green leafy vegetables, lentils and jaggery.", hi: "खट्टा या अचार छोड़ने की ज़रूरत नहीं। संतुलित खाना खाएँ, जिसमें हरी पत्तेदार सब्ज़ियाँ, दाल और गुड़ जैसे आयरन वाले खाने हों।" }, ["nhs_anaemia"]),
  f("mood", ["mood", "sad", "angry", "udaas", "उदास", "गुस्सा", "pms", "चिड़चिड़ा"],
    { en: "Why do I feel moody before my period?", hi: "पीरियड से पहले मूड क्यों बदलता है?" },
    { en: "Hormone changes before a period can affect mood, sleep and energy. This is called PMS (premenstrual syndrome). Rest, exercise and talking to someone may help. If feelings are very strong, see a doctor.", hi: "पीरियड से पहले हार्मोन बदलने से मूड, नींद और ताकत पर असर पड़ सकता है। इसे पीएमएस (पीरियड से पहले की परेशानी) कहते हैं। आराम, कसरत और किसी से बात करना मदद कर सकता है। अगर भावनाएँ बहुत तेज़ हों, तो डॉक्टर को दिखाएँ।" }, ["nhs_pms"]),
  f("acne", ["acne", "pimple", "muhase", "मुँहासे", "दाने"],
    { en: "Why do I get pimples before my period?", hi: "पीरियड से पहले मुँहासे क्यों होते हैं?" },
    { en: "Hormone changes before a period can cause pimples. Gentle washing helps. Lots of acne with irregular periods and extra hair is worth discussing with a doctor.", hi: "पीरियड से पहले हार्मोन बदलने से मुँहासे हो सकते हैं। हल्के से चेहरा धोना मदद करता है। अगर बहुत मुँहासे के साथ पीरियड अनियमित हों और ज़्यादा बाल हों, तो डॉक्टर से बात करें।" }, ["nhs_pms", "nhs_pcos"]),
  f("pregnancy_test", ["pregnant", "pregnancy", "test", "garbh", "गर्भ", "प्रेगनेंसी"],
    { en: "When should I take a pregnancy test?", hi: "प्रेगनेंसी टेस्ट कब करें?" },
    { en: "Most tests work from the first day of a missed period. Free tests may be available from ASHA workers or health centres.", hi: "ज़्यादातर टेस्ट पीरियड छूटने के पहले दिन से काम करते हैं। आशा कार्यकर्ता या स्वास्थ्य केंद्र से मुफ़्त टेस्ट मिल सकते हैं।" }, ["nhs_missed"]),
  f("fertile_safe", ["safe days", "contraception", "prevent pregnancy", "fertile", "ovulation", "सुरक्षित दिन", "ओव्यूलेशन"],
    { en: "Can I use the app's estimates to avoid pregnancy?", hi: "क्या ऐप के अनुमान से गर्भ रोक सकती हूँ?" },
    { en: "No. Estimates can be wrong and cannot be used to prevent pregnancy. Talk to a doctor or health centre about contraception.", hi: "नहीं। अनुमान गलत हो सकते हैं और इनसे गर्भ नहीं रोका जा सकता। गर्भनिरोध के बारे में डॉक्टर या स्वास्थ्य केंद्र से बात करें।" }, ["nhs_fertility"]),
  f("thyroid", ["thyroid", "थायरॉइड", "hormone"],
    { en: "Can thyroid problems affect periods?", hi: "क्या थायरॉइड से पीरियड पर असर पड़ता है?" },
    { en: "Yes, thyroid problems can make periods irregular, lighter or heavier. A blood test can check thyroid levels.", hi: "हाँ, थायरॉइड की समस्या से पीरियड अनियमित, कम या ज़्यादा हो सकते हैं। खून की जाँच से थायरॉइड का पता चल सकता है।" }, ["nhs_missed"], true),
  f("stress", ["stress", "exam", "tension", "तनाव", "परीक्षा", "chinta"],
    { en: "Can exam stress delay my period?", hi: "क्या परीक्षा का तनाव पीरियड देर कर सकता है?" },
    { en: "Yes. Stress can delay or stop periods for a while. Sleep, food and talking to someone you trust can help.", hi: "हाँ। तनाव से पीरियड कुछ समय के लिए देर से आ सकता है या रुक सकता है। नींद, खाना और किसी भरोसेमंद से बात करना मदद कर सकता है।" }, ["nhs_missed"]),
  f("doctor_where", ["doctor", "where", "free", "esanjeevani", "डॉक्टर", "कहाँ", "मुफ़्त", "hospital"],
    { en: "Where can I see a doctor for free?", hi: "मुफ़्त में डॉक्टर कहाँ दिखा सकती हूँ?" },
    { en: "You can visit a government health centre (PHC/CHC) or use eSanjeevani, the government's free online doctor service.", hi: "आप सरकारी स्वास्थ्य केंद्र (पीएचसी/सीएचसी) जा सकती हैं, या सरकार की मुफ़्त ऑनलाइन डॉक्टर सेवा ई-संजीवनी इस्तेमाल कर सकती हैं।" }, ["esanjeevani"]),
  f("talk_doctor", ["shy", "sharam", "शर्म", "embarrassed", "what to say", "क्या बोलूँ"],
    { en: "I feel shy talking to a doctor. What can I do?", hi: "मुझे डॉक्टर से बात करने में शर्म आती है। क्या करूँ?" },
    { en: "That is very common. Doctors talk about periods every day. You can print or show the \"Prepare for my visit\" summary so you don't have to explain everything.", hi: "ऐसा बहुत लोगों को लगता है। डॉक्टर रोज़ पीरियड की बात करते हैं। आप \"डॉक्टर के पास जाने की तैयारी\" वाला सारांश दिखा सकती हैं, ताकि सब कुछ बोलकर न बताना पड़े।" }, ["esanjeevani"]),
  f("discharge", ["discharge", "white", "safed", "सफ़ेद पानी", "smell", "बदबू"],
    { en: "Is white discharge normal?", hi: "क्या सफ़ेद पानी आना सामान्य है?" },
    { en: "Some clear or white discharge is normal and changes through the cycle. If it smells bad, changes colour, or itches, see a doctor.", hi: "थोड़ा साफ़ या सफ़ेद पानी आना सामान्य है और चक्र के साथ बदलता है। अगर बदबू आए, रंग बदले या खुजली हो, तो डॉक्टर को दिखाएँ।" }, ["nhs_periods"], true),
  f("menopause_bleed", ["menopause", "after menopause", "मेनोपॉज़", "बंद होने के बाद"],
    { en: "Is bleeding after menopause normal?", hi: "क्या मेनोपॉज़ के बाद खून आना सामान्य है?" },
    { en: "No. Any bleeding after menopause should be checked by a doctor.", hi: "नहीं। मेनोपॉज़ के बाद कभी भी खून आए, तो डॉक्टर से जाँच करवानी चाहिए।" }, ["nhs_pmb"], true),
  f("privacy", ["private", "privacy", "data", "safe", "निजी", "डेटा", "कौन देखेगा"],
    { en: "Who can see my data?", hi: "मेरा डेटा कौन देख सकता है?" },
    { en: "Your records stay on this device. Saheli has no account and sends nothing to a server. You can add a PIN and turn on discreet mode in Settings.", hi: "आपकी जानकारी इसी फ़ोन में रहती है। सहेली में कोई अकाउंट नहीं है और कुछ भी सर्वर पर नहीं भेजा जाता। सेटिंग में आप पिन लगा सकती हैं और गुप्त मोड चालू कर सकती हैं।" }, []),
  f("sleep", ["sleep", "neend", "नींद", "insomnia"],
    { en: "Why can't I sleep well before my period?", hi: "पीरियड से पहले नींद ठीक क्यों नहीं आती?" },
    { en: "Hormone changes before a period can disturb sleep. A regular bedtime, less screen time at night and gentle exercise may help.", hi: "पीरियड से पहले हार्मोन बदलने से नींद बिगड़ सकती है। रोज़ एक ही समय पर सोना, रात को कम फ़ोन देखना और हल्की कसरत मदद कर सकते हैं।" }, ["nhs_pms"]),
];

export const SUGGESTED = ["late_reason", "pcos_what", "cramps_help", "heavy", "doctor_where", "irregular"];

export const SELF_HARM_KW = ["suicide", "self harm", "self-harm", "kill myself", "end my life", "hurt myself", "आत्महत्या", "खुद को नुकसान", "मरना चाहती", "जान दे"];

const norm = (s) => s.toLowerCase().replace(/[?.!,।]/g, " ").replace(/\s+/g, " ").trim();

// Transparent matching: score = number of FAQ keywords contained in the question.
export function matchFaq(question) {
  const q = ` ${norm(question)} `;
  if (!q.trim()) return { type: "empty" };
  if (SELF_HARM_KW.some((k) => q.includes(k))) return { type: "selfharm" };
  let best = null;
  for (const item of FAQ) {
    const hits = item.kw.filter((k) => q.includes(norm(k)));
    const score = hits.reduce((a, k) => a + (k.includes(" ") ? 2 : 1), 0);
    if (score > 0 && (!best || score > best.score)) best = { item, hits, score };
  }
  return best ? { type: "match", ...best } : { type: "none" };
}
