import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import { webHomeTranslations } from "./webHomeTranslations";
import { sidebarTranslations } from "./sidebarTransaltions";
import { footerTranslations } from "./footerTranslations";
import en from "./en.json";
import fr from "./fr.json";


const getDeviceLanguage = () => {
  const languageCode = Localization.getLocales()[0]?.languageCode;
  return languageCode === "fr" ? "fr" : "en";
};

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: "v4",
    resources: {
      en: {
        translation: en,
        webHome: webHomeTranslations.en,
        sidebar:sidebarTranslations.en,
        footer:footerTranslations.en,
      },
      fr: {
        translation: fr,
        webHome: webHomeTranslations.fr,
        sidebar:sidebarTranslations.fr,
        footer:footerTranslations.fr,
      },
    },
    
    lng: getDeviceLanguage(),
    fallbackLng: "en",
    interpolation: {
      escapeValue: false, 
    },
  });

export default i18n;
