/** Enum vocabularies + bilingual labels. Keep small; UI selects read from here. */
export const GENDER = ["M", "F", "T", "X"] as const;
export const SOCIAL_CATEGORY = ["GEN", "EWS", "OBC-NCL", "OBC-CL", "SC", "ST"] as const;
export const BLOOD_GROUP = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
export const MARITAL = ["single", "married", "divorced", "widowed"] as const;
export const NATIONALITY = ["IN", "NRI", "OCI", "PIO", "FOREIGN"] as const;
export const RELIGION = ["hindu", "muslim", "christian", "sikh", "buddhist", "jain", "parsi", "jewish", "other", "prefer_not"] as const;
export const BOARD = ["CBSE", "CISCE", "NIOS", "IB", "CAIE", "STATE"] as const;
export const STREAM = ["PCM", "PCB", "PCMB", "COMMERCE", "ARTS", "VOCATIONAL"] as const;
export const MEDIUM = ["english", "hindi", "regional", "other"] as const;
export const DEGREE_STATUS = ["pursuing", "completed", "dropped"] as const;
export const EXAM = ["JEE_MAIN", "JEE_ADV", "NEET_UG", "CUET_UG", "GATE", "CAT", "CLAT", "NDA", "UPSC_CSE", "SSC_CGL", "IBPS_PO", "BITSAT", "MHT_CET", "KCET", "WBJEE", "OTHER"] as const;
export const PWD_TYPE = ["locomotor", "visual", "hearing", "speech", "intellectual", "mental_illness", "multiple", "other"] as const;
export const SECTOR = ["private", "psu", "government", "self_employed", "ngo", "other"] as const;
export const ACCOUNT_TYPE = ["savings", "current"] as const;
export const RELATION = ["father", "mother", "guardian", "spouse", "sibling", "child", "grandparent", "other"] as const;
export const LANGUAGE = ["en", "hi", "bn", "te", "mr", "ta", "gu", "kn", "ml", "pa", "or", "as", "ur"] as const;
export const OCCUPATION = ["government", "private", "business", "farmer", "self_employed", "homemaker", "retired", "unemployed", "deceased", "other"] as const;
export const EDU_LEVEL = ["below_10", "class10", "class12", "diploma", "graduate", "postgraduate", "doctorate"] as const;

export const INDIA_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Andaman and Nicobar Islands","Chandigarh","Dadra and Nagar Haveli and Daman and Diu","Delhi","Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry",
] as const;

export const ENUM_LABELS: Record<string, Record<string, { en: string; hi: string }>> = {
  gender: { M: { en: "Male", hi: "पुरुष" }, F: { en: "Female", hi: "महिला" }, T: { en: "Transgender", hi: "ट्रांसजेंडर" }, X: { en: "Prefer not to say", hi: "नहीं बताना चाहते" } },
  social: { GEN: { en: "General", hi: "सामान्य" }, EWS: { en: "EWS", hi: "ईडब्ल्यूएस" }, "OBC-NCL": { en: "OBC (Non-Creamy Layer)", hi: "ओबीसी (नॉन-क्रीमी लेयर)" }, "OBC-CL": { en: "OBC (Creamy Layer)", hi: "ओबीसी (क्रीमी लेयर)" }, SC: { en: "SC", hi: "अनुसूचित जाति" }, ST: { en: "ST", hi: "अनुसूचित जनजाति" } },
  board: { CBSE: { en: "CBSE", hi: "सीबीएसई" }, CISCE: { en: "CISCE (ICSE/ISC)", hi: "सीआईएससीई" }, NIOS: { en: "NIOS", hi: "एनआईओएस" }, IB: { en: "IB", hi: "आईबी" }, CAIE: { en: "Cambridge", hi: "कैम्ब्रिज" }, STATE: { en: "State Board", hi: "राज्य बोर्ड" } },
  nationality: { IN: { en: "Indian", hi: "भारतीय" }, NRI: { en: "NRI", hi: "एनआरआई" }, OCI: { en: "OCI", hi: "ओसीआई" }, PIO: { en: "PIO", hi: "पीआईओ" }, FOREIGN: { en: "Foreign national", hi: "विदेशी नागरिक" } },
  language: { en: { en: "English", hi: "अंग्रेज़ी" }, hi: { en: "Hindi", hi: "हिन्दी" }, bn: { en: "Bengali", hi: "बांग्ला" }, te: { en: "Telugu", hi: "तेलुगु" }, mr: { en: "Marathi", hi: "मराठी" }, ta: { en: "Tamil", hi: "तमिल" }, gu: { en: "Gujarati", hi: "गुजराती" }, kn: { en: "Kannada", hi: "कन्नड़" }, ml: { en: "Malayalam", hi: "मलयालम" }, pa: { en: "Punjabi", hi: "पंजाबी" }, or: { en: "Odia", hi: "ओड़िया" }, as: { en: "Assamese", hi: "असमिया" }, ur: { en: "Urdu", hi: "उर्दू" } },
  yesno: { true: { en: "Yes", hi: "हाँ" }, false: { en: "No", hi: "नहीं" } },
};
