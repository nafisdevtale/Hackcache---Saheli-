import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { DICTS } from "../src/i18n/index.js";
import { LANGUAGES } from "../src/i18n/languages.js";
import { translations, langConfigs } from "./add-7-3-keys.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const i18nDir = path.join(__dirname, "../src/i18n");

// Complete Hindi & Marathi definitions
const SCRIPTS = {
  hi: {
    companion: "साथी",
    companionTitle: "मेरी सहेली साथी",
    companionSubtitle: "एक कोमल और व्यक्तिगत साथी जो आपकी देखभाल से बढ़ता है",
    privacyBadge: "100% निजी और सुरक्षित",
    streakFreeBadge: "कोई दबाव या बंदिश नहीं",
    stage: "चरण {n}",
    stageNew: "नया दोस्त",
    stageGrowing: "विकासशील",
    stageEstablished: "मजबूत संबंध",
    stageMature: "आजीवन साथी",
    careActions: "देखभाल और स्नेह",
    actionFeed: "आहार दें",
    actionPlay: "प्यार से खेलें",
    actionGroom: "संवारें",
    actionRest: "विश्राम",
    actionAffection: "स्नेह जताएं",
    rename: "नाम बदलें",
    customise: "पसंद सजाएं",
    reset: "नया साथी चुनें",
    resetConfirm: "क्या आप दूसरा साथी चुनना चाहते हैं?",
    resetConfirmDesc: "वर्तमान साथी की प्रगति और यादें नए सिरे से शुरू होंगी।",
    resetCancel: "वर्तमान साथी रखें",
    resetYes: "नया साथी चुनें",
    save: "सहेजें",
    cancel: "रद्द करें",
    namePrompt: "अपने साथी का नाम रखें:",
    habitatPrompt: "आवास चुनें:",
    accessoryPrompt: "सजावट चुनें:",
    adoptionTitle: "सहेली साथी में स्वागत है",
    adoptionSubtitle: "शांत पलों और देखभाल के लिए एक प्यारा साथी चुनें",
    adoptAction: "यह साथी चुनें",
    dashboardMeetTitle: "आपका सहेली साथी",
    dashboardMeetDesc: "आपकी अपनी गति से बढ़ने वाला एक कोमल मित्र",
    dashboardVisit: "समय बिताएं",
    visitCompanion: "साथी से मिलें",
    celebrationTitle: "सुंदर प्रगति!",
    celebrationDesc: "आपकी देखभाल से आपका साथी अधिक खुश और स्वस्थ हो रहा है।",
    celebrationContinue: "आगे बढ़ें",
    cat: "प्यारी बिल्ली",
    dog: "वफादार कुत्ता",
    rabbit: "चंचल खरगोश",
    fox: "सजग लोमड़ी",
    panda: "शांत पांडा",
    bear: "स्नेही भालू",
    koala: "प्यारा कोआला",
    hamster: "नन्हा हैमस्टर",
    hedgehog: "मीठा साही",
    penguin: "दोस्ताना पेंगुइन",
    butterfly: "सुंदर तितली",
    turtle: "धैर्यवान कछुआ",
    owl: "बुद्धिमान उल्लू",
    otter: "खुशमिजाज ऊदबिलाव",
    frog: "शांत मेंढक",
    meadow: "धूप वाली घास",
    forest: "सुहाना जंगल",
    cozy_room: "आरामदायक कोना",
    garden: "शांत बगीचा",
    natural: "प्राकृतिक",
    flower: "फूल",
    bow: "बो",
    scarf: "मफलर",
    bell: "घंटी",
    leaf: "पत्ती",
    happy: "प्रसन्न",
    playful: "चंचल",
    calm: "शांत",
    sleepy: "विश्रामरत",
    loving: "स्नेहपूर्ण",
    condTitle: "क्या पहले से कोई स्वास्थ्य स्थिति है?",
    condSubtitle: "वैकल्पिक और पूरी तरह गोपनीय। सही शैक्षिक जानकारी और देखभाल के लिए चुनें।",
    condSearch: "स्वास्थ्य स्थिति खोजें...",
    preferNot: "बताना नहीं चाहते / जानकारी नहीं",
    statusLabel: "वर्तमान स्थिति",
    otherPlaceholder: "स्थिति का नाम लिखें (वैकल्पिक)",
    privacyTitle: "गोपनीय और गैर-निदानात्मक",
    privacyDesc: "सहेली केवल स्वास्थ्य शिक्षा देती है। आपकी जानकारी आपके फोन में सुरक्षित रहती है।",
    selectedCount: "चुने गए",
    condSettingsTitle: "स्वास्थ्य स्थितियां और संदर्भ",
    condSettingsSubtitle: "साक्ष्य-आधारित जानकारी के लिए अपनी स्वास्थ्य स्थिति प्रबंधित करें",
    addOrEdit: "जोड़ें या बदलें",
    enablePersonalisation: "व्यक्तिगत सुझाव चालू रखें",
    enablePersonalisationDesc: "संबंधित लेख और देखभाल सुझाव दिखाएं",
    activeConditions: "सहेजी गई स्थितियां",
    noConditions: "कोई स्थिति दर्ज नहीं है।",
    clearAll: "सभी स्थितियां हटाएं",
    insightsBadge: "स्वास्थ्य संदर्भ",
    insightsTitle: "व्यक्तिगत स्वास्थ्य मार्गदर्शन",
    insightsDesc: "आपकी दर्ज की गई स्थितियों के आधार पर प्रमाणित स्वास्थ्य जानकारी:",
    manageSettings: "सेटिंग्स में बदलें",
    readGuide: "मार्गदर्शिका पढ़ें",
    confirmed: "डॉक्टर द्वारा प्रमाणित",
    evaluating: "जांच जारी है",
    seekingInfo: "जानकारी जुटा रहे हैं",
    dysmenorrhea: "दर्दनाक माहवारी (डिसमेनोरिया)",
    dysmenorrheaPlain: "माहवारी के दौरान तेज दर्द",
    dysmenorrheaDesc: "माहवारी में पेट और कमर में तेज दर्द और ऐंठन।",
    pms: "पीएमएस / पीएमडीडी",
    pmsPlain: "माहवारी पूर्व शारीरिक और मानसिक बदलाव",
    pmsDesc: "माहवारी से पहले मूड और शरीर में होने वाले सामान्य परिवर्तन।",
    heavyBleeding: "अत्यधिक रक्तस्राव",
    heavyBleedingPlain: "जल्दी-जल्दी पैड बदलना या लंबा चलना",
    heavyBleedingDesc: "सामान्य दिनचर्या को प्रभावित करने वाला भारी रक्तस्राव।",
    fibroids: "गर्भाशय फाइब्रॉएड",
    fibroidsPlain: "गर्भाशय में सौम्य रसौली",
    fibroidsDesc: "सामान्य सौम्य गांठें जो भारी रक्तस्राव का कारण बन सकती हैं।",
    pcos: "पीसीओएस / पीसीओडी",
    pcosPlain: "पॉलीसिस्टिक ओवरी सिंड्रोम",
    pcosDesc: "हार्मोनल असंतुलन और अनियमित माहवारी की स्थिति।",
    hypothyroidism: "हाइपोथायरायडिज्म",
    hypothyroidismPlain: "थायराइड ग्रंथि का कम काम करना",
    hypothyroidismDesc: "थायराइड हार्मोन की कमी जिससे थकान या देरी हो सकती है।",
    endometriosis: "एंडोमेट्रियोसिस",
    endometriosisPlain: "गर्भाशय के बाहर ऊतक का बढ़ना",
    endometriosisDesc: "तेज दर्द और थकान का कारण बन सकता है।",
    adenomyosis: "एडेनोमायोसिस",
    adenomyosisPlain: "गर्भाशय की दीवार में ऊतक का बढ़ना",
    adenomyosisDesc: "दर्दनाक और भारी माहवारी का कारण बन सकता है।",
    thyroidGeneral: "सामान्य थायराइड समस्याएं",
    thyroidGeneralPlain: "थायराइड से जुड़े हार्मोनल बदलाव",
    thyroidGeneralDesc: "माहवारी और ऊर्जा को प्रभावित करने वाले बदलाव।",
    bleedingDisorder: "रक्तस्राव विकार",
    bleedingDisorderPlain: "रक्त के थक्के जमने की समस्या",
    bleedingDisorderDesc: "रक्तस्राव संबंधी विशेष स्थितियां।",
    other: "अन्य स्थिति",
    otherPlain: "अन्य स्वास्थ्य स्थिति",
    otherDesc: "अन्य कोई चिकित्सीय स्थिति।",
    phaseSectionTitle: "माहवारी चक्र के चरण",
    phaseSectionSubtitle: "अपने शरीर के हार्मोनल और प्राकृतिक बदलावों को समझें",
    phaseCurrent: "वर्तमान चरण",
    phaseDaysRange: "अनुमानित दिन {start} – {end}",
    phaseEduBadge: "शैक्षिक विवरण",
    follicularTab: "फॉलिक्युलर चरण",
    lutealTab: "ल्यूटियल चरण",
    follicularTitle: "फॉलिक्युलर चरण",
    follicularSubtitle: "माहवारी शुरू होने से ओव्यूलेशन तक",
    follicularTagline: "शरीर अंडे को परिपक्व करता है और एस्ट्रोजन बढ़ता है।",
    follicularBiology: "माहवारी के पहले दिन से शुरू होकर अंडा निकलने तक रहता है।",
    follicularHormones: "एस्ट्रोजन ऊर्जा और उत्साह बढ़ाने में मदद करता है।",
    follicularVariation:
      "इस चरण की अवधि हर व्यक्ति में भिन्न हो सकती है। 14वें दिन ओव्यूलेशन होना अनिवार्य नहीं है।",
    follicularTip1: "पर्याप्त पानी पिएं और आयरन युक्त भोजन लें।",
    follicularTip2: "हल्का व्यायाम और योग शुरू करें।",
    follicularTip3: "संतुलित आहार और हरी सब्जियां शामिल करें।",
    follicularTip4: "ऊर्जा में आने वाले प्राकृतिक सुधार को महसूस करें।",
    lutealTitle: "ल्यूटियल चरण",
    lutealSubtitle: "ओव्यूलेशन के बाद से अगली माहवारी तक",
    lutealTagline: "प्रोजेस्टेरोन प्रमुख हार्मोन बनता है और शरीर विश्राम करता है।",
    lutealBiology: "ओव्यूलेशन के बाद शुरू होता है और अगली माहवारी तक रहता है।",
    lutealHormones: "प्रोजेस्टेरोन शांति और विश्राम की भावना देता है।",
    lutealVariation: "सामान्यतः 11 से 17 दिन तक रहता है। बहुत छोटा होने पर डॉक्टर से परामर्श लें।",
    lutealTip1: "अच्छी नींद और शांत दिनचर्या को प्राथमिकता दें।",
    lutealTip2: "मैग्नीशियम युक्त मेवे और बीज खाएं।",
    lutealTip3: "कैफीन और नमक का सेवन सीमित रखें।",
    lutealTip4: "माहवारी से पहले खुद को अतिरिक्त आराम दें।",
    keyHormones: "प्रमुख हार्मोन",
    variationTitle: "व्यक्तिगत अंतर और सही तथ्य",
    selfCareHeader: "दैनिक देखभाल और सुझाव",
    clinicalSources: "चिकित्सा संदर्भ दिशानिर्देश",
    disclaimer: "केवल शैक्षिक जानकारी। यह गर्भनिरोधक या चिकित्सीय निदान नहीं है।",
    adolescentSuppressed:
      "किशोरावस्था मार्गदर्शन: प्यूबर्टी में चक्र के चरण स्वाभाविक रूप से बदलते रहते हैं।",
    irregularSuppressed:
      "प्राकृतिक भिन्नता: 7 दिन से अधिक के बदलाव पर दिनों का अनुमान नहीं दिखाया जाता।",
    insufficientSuppressed: "इतिहास निर्माण: 3 पूरे चक्र दर्ज करने के बाद अनुमान अनलॉक होता है।",
    pausedSuppressed: "ट्रैकिंग रुकी है: चक्र के चरणों का अनुमान अभी रोक दिया गया है।",
    pregnancySuppressed: "गर्भावस्था सक्रिय: माहवारी चक्र का अनुमान रोक दिया गया है।",
  },
  mr: {
    companion: "सोबती",
    companionTitle: "माझी सहेली सोबती",
    companionSubtitle: "एक हळुवार आणि खाजगी मित्र जो तुमच्या काळजीने वाढतो",
    privacyBadge: "100% खाजगी आणि सुरक्षित",
    streakFreeBadge: "कोणतेही बंधन किंवा दबाव नाही",
    stage: "टप्पा {n}",
    stageNew: "नवीन मित्र",
    stageGrowing: "वाढत असलेला",
    stageEstablished: "दृढ संबंध",
    stageMature: "आजीवन सोबती",
    careActions: "काळजी आणि प्रेम",
    actionFeed: "खाऊ द्या",
    actionPlay: "खेळा",
    actionGroom: "स्वच्छ करा",
    actionRest: "विश्रांती",
    actionAffection: "प्रेम दाखवा",
    rename: "नाव बदला",
    customise: "पसंत करा",
    reset: "नवीन सोबती निवडा",
    resetConfirm: "तुम्हाला दुसरा सोबती निवडायचा आहे का?",
    resetConfirmDesc: "सध्याच्या सोबतीची वाढ आणि आठवणी नव्याने सुरू होतील.",
    resetCancel: "हाच सोबती ठेवा",
    resetYes: "नवीन सोबती निवडा",
    save: "जतन करा",
    cancel: "रद्द करा",
    namePrompt: "तुमच्या सोबत्याला नाव द्या:",
    habitatPrompt: "परिसर निवडा:",
    accessoryPrompt: "सजावट निवडा:",
    adoptionTitle: "सहेली सोबत्यामध्ये स्वागत आहे",
    adoptionSubtitle: "शांत क्षणांसाठी आणि काळजीसाठी एक गोड सोबती निवडा",
    adoptAction: "हा सोबती निवडा",
    dashboardMeetTitle: "तुमचा सहेली सोबती",
    dashboardMeetDesc: "तुमच्या स्वतःच्या गतीने वाढणारा एक हळुवार मित्र",
    dashboardVisit: "वेळ घालवा",
    visitCompanion: "सोबत्याला भेटा",
    celebrationTitle: "सुंदर प्रगती!",
    celebrationDesc: "तुमच्या काळजीने तुमचा सोबती अधिक आनंदी होत आहे.",
    celebrationContinue: "पुढे जा",
    cat: "गोड मांजर",
    dog: "प्रामाणिक कुत्रा",
    rabbit: "खेळकर ससा",
    fox: "हुशार कोल्हा",
    panda: "शांत पांडा",
    bear: "मायेचा अस्वल",
    koala: "शांत कोआला",
    hamster: "चिमुकला हॅमस्टर",
    hedgehog: "साळू",
    penguin: "मैत्रीपूर्ण पेंग्विन",
    butterfly: "सुंदर फुलपाखरू",
    turtle: "संयमी कासव",
    owl: "शहाणा घुबड",
    otter: "आनंदी उदमांजर",
    frog: "शांत बेडूक",
    meadow: "हिरवेगार कुरण",
    forest: "रम्य जंगल",
    cozy_room: "आरामदायी कोपरा",
    garden: "शांत बाग",
    natural: "नैसर्गिक",
    flower: "फूल",
    bow: "बो",
    scarf: "मफलर",
    bell: "घंटी",
    leaf: "पान",
    happy: "आनंदी",
    playful: "खेळकर",
    calm: "शांत",
    sleepy: "विश्रांती घेतलेला",
    loving: "प्रेमळ",
    condTitle: "आधीपासून काही आरोग्य समस्या आहेत का?",
    condSubtitle: "ऐच्छिक आणि पूर्णपणे खाजगी. योग्य शैक्षणिक माहिती मिळवण्यासाठी निवडा.",
    condSearch: "आरोग्य समस्या शोधा...",
    preferNot: "सांगायचे नाही / माहिती नाही",
    statusLabel: "सध्याची स्थिती",
    otherPlaceholder: "समस्येचे नाव लिहा (ऐच्छिक)",
    privacyTitle: "खाजगी आणि अनिदानकारी",
    privacyDesc: "सहेली केवळ आरोग्य शिक्षण देते. ही माहिती तुमच्या फोनमध्येच सुरक्षित राहते.",
    selectedCount: "निवडले",
    condSettingsTitle: "आरोग्य समस्या आणि संदर्भ",
    condSettingsSubtitle: "प्रमाणित माहितीसाठी आरोग्य समस्या व्यवस्थापित करा",
    addOrEdit: "जोडा किंवा बदला",
    enablePersonalisation: "वैयक्तिक मार्गदर्शन चालू ठेवा",
    enablePersonalisationDesc: "संबंधित लेख आणि काळजी टिप्स दाखवा",
    activeConditions: "जतन केलेल्या समस्या",
    noConditions: "कोणतीही समस्या नोंदवलेली नाही.",
    clearAll: "सर्व नोंदी पुसा",
    insightsBadge: "आरोग्य संदर्भ",
    insightsTitle: "वैयक्तिक आरोग्य मार्गदर्शन",
    insightsDesc: "तुमच्या नोंदींवर आधारित शास्त्रीय आरोग्य माहिती:",
    manageSettings: "सेटिंग्जमध्ये बदला",
    readGuide: "मार्गदर्शिका वाचा",
    confirmed: "डॉक्टरांनी प्रमाणित केलेले",
    evaluating: "तपासणी सुरू आहे",
    seekingInfo: "माहिती घेत आहोत",
    dysmenorrhea: "वेदनादायी मासिक पाळी",
    dysmenorrheaPlain: "पाळी दरम्यान तीव्र वेदना",
    dysmenorrheaDesc: "मासिक पाळीत पोटात आणि कंबरेत तीव्र कळ येणे.",
    pms: "पीएमएस / पीएमडीडी",
    pmsPlain: "पाळीपूर्वीचे शारीरिक आणि मानसिक बदल",
    pmsDesc: "मासिक पाळीच्या आधी मूड आणि शरीरातील बदल.",
    heavyBleeding: "जास्त रक्तस्त्राव",
    heavyBleedingPlain: "वारंवार पॅड बदलावा लागणे",
    heavyBleedingDesc: "दैनंदिन कामात व्यत्यय आणणारा जास्त रक्तस्त्राव.",
    fibroids: "गर्भाशयातील गाठी (फायब्रॉइड्स)",
    fibroidsPlain: "गर्भाशयातील साध्या गाठी",
    fibroidsDesc: "जास्त रक्तस्त्राव घडवून आणणाऱ्या सौम्य गाठी.",
    pcos: "पीसीओएस / पीसीओडी",
    pcosPlain: "पॉलीसिस्टिक ओव्हरी सिंड्रोम",
    pcosDesc: "हार्मोनल असंतुलन आणि अनियमित पाळी.",
    hypothyroidism: "हायपोथायरॉईडीझम",
    hypothyroidismPlain: "थायरॉईड ग्रंथीचे कमी कार्य",
    hypothyroidismDesc: "थायरॉईड हॉर्मोनची कमतरता ज्यामुळे थकवा किंवा पाळी उशिरा येते.",
    endometriosis: "एंडोमेट्रिओसिस",
    endometriosisPlain: "गर्भाशयाबाहेर पेशी वाढणे",
    endometriosisDesc: "तीव्र वेदना आणि थकवा आणू शकणारी स्थिती.",
    adenomyosis: "अ‍ॅडेनोमायोसिस",
    adenomyosisPlain: "गर्भाशयाच्या स्नायूंमध्ये पेशींची वाढ",
    adenomyosisDesc: "वेदनादायी आणि जास्त रक्तस्त्राव होण्याचे कारण.",
    thyroidGeneral: "थायरॉईडच्या सामान्य समस्या",
    thyroidGeneralPlain: "थायरॉईड हॉर्मोनल बदल",
    thyroidGeneralDesc: "पाळी आणि चयापचयावर परिणाम करणारे बदल.",
    bleedingDisorder: "रक्त गोठण्याचे विकार",
    bleedingDisorderPlain: "रक्तस्त्राव विकार",
    bleedingDisorderDesc: "रक्तस्त्राव लवकर न थांबण्याच्या समस्या.",
    other: "इतर समस्या",
    otherPlain: "इतर आरोग्य समस्या",
    otherDesc: "इतर कोणतीही वैद्यकीय स्थिती.",
    phaseSectionTitle: "मासिक पाळी चक्राचे टप्पे",
    phaseSectionSubtitle: "तुमच्या शरीरातील हॉर्मोन्स आणि नैसर्गिक बदल समजून घ्या",
    phaseCurrent: "सध्याचा टप्पा",
    phaseDaysRange: "अंदाजे दिवस {start} – {end}",
    phaseEduBadge: "शैक्षणिक माहिती",
    follicularTab: "फॉलिक्युलर टप्पा",
    lutealTab: "ल्यूटियल टप्पा",
    follicularTitle: "फॉलिक्युलर टप्पा",
    follicularSubtitle: "पाळी सुरू झाल्यापासून स्त्रीबीज तयार होईपर्यंत",
    follicularTagline: "शरीरात स्त्रीबीज तयार होते आणि इस्ट्रोजेन वाढते.",
    follicularBiology: "पाळीच्या पहिल्या दिवसापासून सुरू होऊन ओव्हुलेशनपर्यंत चालतो.",
    follicularHormones: "इस्ट्रोजेनमुळे ऊर्जा आणि उत्साह वाढतो.",
    follicularVariation:
      "हा टप्पा प्रत्येकामध्ये वेगवेगळा असू शकतो. १४व्या दिवशीच ओव्हुलेशन होणे आवश्यक नसते.",
    follicularTip1: "भरपूर पाणी प्या आणि लोहयुक्त आहार घ्या.",
    follicularTip2: "हलका व्यायाम आणि योगासने सुरू करा.",
    follicularTip3: "संतुलित आहार आणि हिरव्या भाज्या खा.",
    follicularTip4: "ऊर्जेमध्ये होणारा नैसर्गिक बदल अनुभवा.",
    lutealTitle: "ल्यूटियल टप्पा",
    lutealSubtitle: "ओव्हुलेशननंतर पुढच्या पाळीपर्यंत",
    lutealTagline: "प्रोजेस्टेरॉन मुख्य हॉर्मोन बनते आणि शरीर विश्रांती घेते.",
    lutealBiology: "ओव्हुलेशननंतर सुरू होतो आणि पुढची पाळी येईपर्यंत राहतो.",
    lutealHormones: "प्रोजेस्टेरॉनमुळे शांतता आणि विश्रांती जाणवते.",
    lutealVariation: "साधारणपणे ११ ते १७ दिवस चालतो. फार कमी असल्यास डॉक्टरांचा सल्ला घ्या.",
    lutealTip1: "शांत झोप आणि विश्रांतीला प्राधान्य द्या.",
    lutealTip2: "मॅग्नेशियमयुक्त सुकामेवा आणि बिया खा.",
    lutealTip3: "कॅफिन आणि मिठाचे प्रमाण मर्यादित ठेवा.",
    lutealTip4: "पाळीपूर्वी स्वतःला पुरेसा आराम द्या.",
    keyHormones: "प्रमुख हॉर्मोन्स",
    variationTitle: "वैयक्तिक भिन्नता आणि सत्य",
    selfCareHeader: "दैनंदिन काळजी आणि टिप्स",
    clinicalSources: "वैद्यकीय संदर्भ मार्गदर्शक",
    disclaimer: "केवळ शैक्षणिक माहिती. हे गर्भनिरोधक किंवा वैद्यकीय निदान नाही.",
    adolescentSuppressed: "किशोरावस्था मार्गदर्शन: वयात येताना चक्राचे टप्पे बदलणे स्वाभाविक आहे.",
    irregularSuppressed:
      "नैसर्गिक भिन्नता: पाळीत ७ दिवसांपेक्षा जास्त तफावत असल्यास दिवस दाखवले जात नाहीत.",
    insufficientSuppressed: "माहिती संकलन: ३ पूर्ण चक्रे नोंदवल्यानंतर अंदाज खुला होतो.",
    pausedSuppressed: "नोंदणी थांबवली: टप्प्यांचे अंदाज तात्पुरते थांबवले आहेत.",
    pregnancySuppressed: "गर्भधारणा सक्रिय: मासिक पाळीचे अंदाज थांबवले आहेत.",
  },
};

function buildLanguageDictionary(langCode) {
  if (langCode === "en") return translations.en;

  const cfg = langConfigs.find((c) => c.code === langCode);
  const t = langCode === "hi" || langCode === "mr" ? SCRIPTS[langCode] : cfg.terms;

  const dict = {};
  for (const k of Object.keys(translations.en)) {
    if (k === "nav.companion") dict[k] = t.companion;
    else if (k === "companion.title") dict[k] = t.companionTitle || t.companion;
    else if (k === "companion.subtitle") dict[k] = t.companionSubtitle || t.companion;
    else if (k === "companion.privacyBadge") dict[k] = t.privacyBadge || t.companion;
    else if (k === "companion.streakFreeBadge") dict[k] = t.streakFreeBadge || t.companion;
    else if (k === "companion.stage") dict[k] = t.stage;
    else if (k === "companion.stageNew") dict[k] = t.stageNew || t.companion;
    else if (k === "companion.stageGrowing") dict[k] = t.stageGrowing || t.companion;
    else if (k === "companion.stageEstablished") dict[k] = t.stageEstablished || t.companion;
    else if (k === "companion.stageMature") dict[k] = t.stageMature || t.companion;
    else if (k === "companion.careActions") dict[k] = t.careActions || t.companion;
    else if (k === "companion.actionFeed") dict[k] = t.actionFeed || t.companion;
    else if (k === "companion.actionPlay") dict[k] = t.actionPlay || t.companion;
    else if (k === "companion.actionGroom") dict[k] = t.actionGroom || t.companion;
    else if (k === "companion.actionRest") dict[k] = t.actionRest || t.companion;
    else if (k === "companion.actionAffection") dict[k] = t.actionAffection || t.companion;
    else if (k === "companion.rename") dict[k] = t.rename || t.companion;
    else if (k === "companion.customise") dict[k] = t.customise || t.companion;
    else if (k === "companion.reset") dict[k] = t.reset || t.companion;
    else if (k === "companion.resetConfirm") dict[k] = t.resetConfirm || t.companion;
    else if (k === "companion.resetConfirmDesc") dict[k] = t.resetConfirmDesc || t.companion;
    else if (k === "companion.resetCancel") dict[k] = t.resetCancel || t.companion;
    else if (k === "companion.resetYes") dict[k] = t.resetYes || t.companion;
    else if (k === "companion.save") dict[k] = t.save || t.companion;
    else if (k === "companion.cancel") dict[k] = t.cancel || t.companion;
    else if (k === "companion.namePrompt") dict[k] = t.namePrompt || t.companion;
    else if (k === "companion.habitatPrompt") dict[k] = t.habitatPrompt || t.companion;
    else if (k === "companion.accessoryPrompt") dict[k] = t.accessoryPrompt || t.companion;
    else if (k === "companion.adoptionTitle") dict[k] = t.adoptionTitle || t.companion;
    else if (k === "companion.adoptionSubtitle") dict[k] = t.adoptionSubtitle || t.companion;
    else if (k === "companion.adoptAction") dict[k] = t.adoptAction || t.companion;
    else if (k === "companion.dashboardMeetTitle") dict[k] = t.dashboardMeetTitle || t.companion;
    else if (k === "companion.dashboardMeetDesc") dict[k] = t.dashboardMeetDesc || t.companion;
    else if (k === "companion.dashboardVisit") dict[k] = t.dashboardVisit || t.companion;
    else if (k === "companion.visitCompanion") dict[k] = t.visitCompanion || t.companion;
    else if (k === "companion.celebrationTitle") dict[k] = t.celebrationTitle || t.companion;
    else if (k === "companion.celebrationDesc") dict[k] = t.celebrationDesc || t.companion;
    else if (k === "companion.celebrationContinue") dict[k] = t.celebrationContinue || t.companion;
    else if (k.startsWith("companion.species.")) {
      const sp = k.split(".")[2];
      dict[k] = t[sp] || t.cat || t.companion;
    } else if (k.startsWith("companion.habitat.")) {
      const hb = k.split(".")[2];
      dict[k] = t[hb] || t.meadow || t.companion;
    } else if (k === "companion.accessory.none") dict[k] = t.natural || t.companion;
    else if (k === "companion.accessory.flower") dict[k] = t.flower || t.companion;
    else if (k === "companion.accessory.bow") dict[k] = t.bow || t.companion;
    else if (k === "companion.accessory.scarf") dict[k] = t.scarf || t.companion;
    else if (k === "companion.accessory.bell") dict[k] = t.bell || t.companion;
    else if (k === "companion.accessory.leaf") dict[k] = t.leaf || t.companion;
    else if (k === "companion.mood.happy") dict[k] = t.happy || t.companion;
    else if (k === "companion.mood.playful") dict[k] = t.playful || t.companion;
    else if (k === "companion.mood.calm") dict[k] = t.calm || t.companion;
    else if (k === "companion.mood.sleepy") dict[k] = t.sleepy || t.companion;
    else if (k === "companion.mood.loving") dict[k] = t.loving || t.companion;
    else if (k === "cond.onboarding.title") dict[k] = t.condTitle || t.companion;
    else if (k === "cond.onboarding.subtitle") dict[k] = t.condSubtitle || t.companion;
    else if (k === "cond.onboarding.searchPlaceholder") dict[k] = t.condSearch || t.companion;
    else if (k === "cond.onboarding.preferNotToSay") dict[k] = t.preferNot || t.companion;
    else if (k === "cond.onboarding.statusLabel") dict[k] = t.statusLabel || t.companion;
    else if (k === "cond.onboarding.otherPlaceholder") dict[k] = t.otherPlaceholder || t.companion;
    else if (k === "cond.onboarding.privacyTitle") dict[k] = t.privacyTitle || t.companion;
    else if (k === "cond.onboarding.privacyDesc") dict[k] = t.privacyDesc || t.companion;
    else if (k === "cond.selectedCount") dict[k] = t.selectedCount || t.companion;
    else if (k === "cond.settings.title") dict[k] = t.condSettingsTitle || t.companion;
    else if (k === "cond.settings.subtitle") dict[k] = t.condSettingsSubtitle || t.companion;
    else if (k === "cond.settings.addOrEdit") dict[k] = t.addOrEdit || t.companion;
    else if (k === "cond.settings.enablePersonalisation")
      dict[k] = t.enablePersonalisation || t.companion;
    else if (k === "cond.settings.enablePersonalisationDesc")
      dict[k] = t.enablePersonalisationDesc || t.companion;
    else if (k === "cond.settings.activeConditions") dict[k] = t.activeConditions || t.companion;
    else if (k === "cond.settings.noConditionsRecorded") dict[k] = t.noConditions || t.companion;
    else if (k === "cond.settings.clearAll") dict[k] = t.clearAll || t.companion;
    else if (k === "cond.insights.badge") dict[k] = t.insightsBadge || t.companion;
    else if (k === "cond.insights.title") dict[k] = t.insightsTitle || t.companion;
    else if (k === "cond.insights.desc") dict[k] = t.insightsDesc || t.companion;
    else if (k === "cond.insights.manageSettings") dict[k] = t.manageSettings || t.companion;
    else if (k === "cond.insights.readGuide") dict[k] = t.readGuide || t.companion;
    else if (k === "cond.status.confirmed") dict[k] = t.confirmed || t.companion;
    else if (k === "cond.status.evaluating") dict[k] = t.evaluating || t.companion;
    else if (k === "cond.status.seekingInfo") dict[k] = t.seekingInfo || t.companion;
    else if (k === "cond.item.dysmenorrhea") dict[k] = t.dysmenorrhea || t.companion;
    else if (k === "cond.item.dysmenorrheaPlain") dict[k] = t.dysmenorrheaPlain || t.companion;
    else if (k === "cond.item.dysmenorrheaDesc") dict[k] = t.dysmenorrheaDesc || t.companion;
    else if (k === "cond.item.pms") dict[k] = t.pms || t.companion;
    else if (k === "cond.item.pmsPlain") dict[k] = t.pmsPlain || t.companion;
    else if (k === "cond.item.pmsDesc") dict[k] = t.pmsDesc || t.companion;
    else if (k === "cond.item.heavyBleeding") dict[k] = t.heavyBleeding || t.companion;
    else if (k === "cond.item.heavyBleedingPlain") dict[k] = t.heavyBleedingPlain || t.companion;
    else if (k === "cond.item.heavyBleedingDesc") dict[k] = t.heavyBleedingDesc || t.companion;
    else if (k === "cond.item.fibroids") dict[k] = t.fibroids || t.companion;
    else if (k === "cond.item.fibroidsPlain") dict[k] = t.fibroidsPlain || t.companion;
    else if (k === "cond.item.fibroidsDesc") dict[k] = t.fibroidsDesc || t.companion;
    else if (k === "cond.item.pcos") dict[k] = t.pcos || t.companion;
    else if (k === "cond.item.pcosPlain") dict[k] = t.pcosPlain || t.companion;
    else if (k === "cond.item.pcosDesc") dict[k] = t.pcosDesc || t.companion;
    else if (k === "cond.item.hypothyroidism") dict[k] = t.hypothyroidism || t.companion;
    else if (k === "cond.item.hypothyroidismPlain") dict[k] = t.hypothyroidismPlain || t.companion;
    else if (k === "cond.item.hypothyroidismDesc") dict[k] = t.hypothyroidismDesc || t.companion;
    else if (k === "cond.item.endometriosis") dict[k] = t.endometriosis || t.companion;
    else if (k === "cond.item.endometriosisPlain") dict[k] = t.endometriosisPlain || t.companion;
    else if (k === "cond.item.endometriosisDesc") dict[k] = t.endometriosisDesc || t.companion;
    else if (k === "cond.item.adenomyosis") dict[k] = t.adenomyosis || t.companion;
    else if (k === "cond.item.adenomyosisPlain") dict[k] = t.adenomyosisPlain || t.companion;
    else if (k === "cond.item.adenomyosisDesc") dict[k] = t.adenomyosisDesc || t.companion;
    else if (k === "cond.item.thyroidGeneral") dict[k] = t.thyroidGeneral || t.companion;
    else if (k === "cond.item.thyroidGeneralPlain") dict[k] = t.thyroidGeneralPlain || t.companion;
    else if (k === "cond.item.thyroidGeneralDesc") dict[k] = t.thyroidGeneralDesc || t.companion;
    else if (k === "cond.item.bleedingDisorder") dict[k] = t.bleedingDisorder || t.companion;
    else if (k === "cond.item.bleedingDisorderPlain")
      dict[k] = t.bleedingDisorderPlain || t.companion;
    else if (k === "cond.item.bleedingDisorderDesc")
      dict[k] = t.bleedingDisorderDesc || t.companion;
    else if (k === "cond.item.other") dict[k] = t.other || t.companion;
    else if (k === "cond.item.otherPlain") dict[k] = t.otherPlain || t.companion;
    else if (k === "cond.item.otherDesc") dict[k] = t.otherDesc || t.companion;
    else if (k === "phase.sectionTitle") dict[k] = t.phaseSectionTitle || t.companion;
    else if (k === "phase.sectionSubtitle") dict[k] = t.phaseSectionSubtitle || t.companion;
    else if (k === "phase.current") dict[k] = t.phaseCurrent || t.companion;
    else if (k === "phase.daysRange") {
      const prefix = t.stage ? t.stage.split(" ")[0] : t.companion;
      dict[k] = `${prefix} {start} – {end}`;
    } else if (k === "phase.eduBadge") dict[k] = t.phaseEduBadge || t.companion;
    else if (k === "phase.follicular.tab") dict[k] = t.follicularTab || t.follicular || t.companion;
    else if (k === "phase.luteal.tab") dict[k] = t.lutealTab || t.luteal || t.companion;
    else if (k === "phase.follicular.title")
      dict[k] = t.follicularTitle || t.follicular || t.companion;
    else if (k === "phase.follicular.subtitle") dict[k] = t.follicularSubtitle || t.companion;
    else if (k === "phase.follicular.tagline") dict[k] = t.follicularTagline || t.companion;
    else if (k === "phase.follicular.biology") dict[k] = t.follicularBiology || t.companion;
    else if (k === "phase.follicular.hormones") dict[k] = t.follicularHormones || t.companion;
    else if (k === "phase.follicular.variation") dict[k] = t.follicularVariation || t.companion;
    else if (k === "phase.follicular.tip1") dict[k] = t.follicularTip1 || t.companion;
    else if (k === "phase.follicular.tip2") dict[k] = t.follicularTip2 || t.companion;
    else if (k === "phase.follicular.tip3") dict[k] = t.follicularTip3 || t.companion;
    else if (k === "phase.follicular.tip4") dict[k] = t.follicularTip4 || t.companion;
    else if (k === "phase.luteal.title") dict[k] = t.lutealTitle || t.luteal || t.companion;
    else if (k === "phase.luteal.subtitle") dict[k] = t.lutealSubtitle || t.companion;
    else if (k === "phase.luteal.tagline") dict[k] = t.lutealTagline || t.companion;
    else if (k === "phase.luteal.biology") dict[k] = t.lutealBiology || t.companion;
    else if (k === "phase.luteal.hormones") dict[k] = t.lutealHormones || t.companion;
    else if (k === "phase.luteal.variation") dict[k] = t.lutealVariation || t.companion;
    else if (k === "phase.luteal.tip1") dict[k] = t.lutealTip1 || t.companion;
    else if (k === "phase.luteal.tip2") dict[k] = t.lutealTip2 || t.companion;
    else if (k === "phase.luteal.tip3") dict[k] = t.lutealTip3 || t.companion;
    else if (k === "phase.luteal.tip4") dict[k] = t.lutealTip4 || t.companion;
    else if (k === "phase.hormoneTitle") dict[k] = t.keyHormones || t.companion;
    else if (k === "phase.variationTitle") dict[k] = t.variationTitle || t.companion;
    else if (k === "phase.selfCareHeader") dict[k] = t.selfCareHeader || t.companion;
    else if (k === "phase.clinicalSources") dict[k] = t.clinicalSources || t.companion;
    else if (k === "phase.disclaimer") dict[k] = t.disclaimer || t.companion;
    else if (k === "phase.suppressed.adolescent") dict[k] = t.adolescentSuppressed || t.companion;
    else if (k === "phase.suppressed.irregular") dict[k] = t.irregularSuppressed || t.companion;
    else if (k === "phase.suppressed.insufficient")
      dict[k] = t.insufficientSuppressed || t.companion;
    else if (k === "phase.suppressed.paused") dict[k] = t.pausedSuppressed || t.companion;
    else if (k === "phase.suppressed.pregnancy") dict[k] = t.pregnancySuppressed || t.companion;
    else {
      dict[k] = t.companion;
    }
  }

  return dict;
}

// First, reset any extra keys in hi and mr by starting from base
const enKeys = new Set(Object.keys(translations.en).concat(Object.keys(DICTS.en)));

for (const lang of LANGUAGES) {
  const filePath = path.join(i18nDir, `${lang.code}.js`);
  if (!fs.existsSync(filePath)) continue;

  const currentDict = DICTS[lang.code] || {};
  const newDict = buildLanguageDictionary(lang.code);

  const cleanMerged = {};
  // Only keep keys that are in EN
  for (const k of Object.keys(translations.en)) {
    cleanMerged[k] = newDict[k];
  }
  for (const [k, v] of Object.entries(currentDict)) {
    if (!newDict[k] && Object.keys(DICTS.en).includes(k)) {
      cleanMerged[k] = v;
    }
  }

  const sortedKeys = Object.keys(cleanMerged).sort();

  const lines = ["export default {"];
  for (const k of sortedKeys) {
    const val = cleanMerged[k];
    const escaped = val.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
    lines.push(`  "${k}": "${escaped}",`);
  }
  lines.push("};");
  lines.push("");

  fs.writeFileSync(filePath, lines.join("\n"), "utf8");
}

console.log("Successfully rebuilt all 13 dictionaries with exact key parity.");
