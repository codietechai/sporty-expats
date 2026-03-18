import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import { webHomeTranslations } from "./webHomeTranslations";
import { sidebarTranslations } from "./sidebarTransaltions";
import { footerTranslations } from "./footerTranslations";


const getDeviceLanguage = () => Localization.locale.split("-")[0] || "fr"; 

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: "v4",
    resources: {
      en: {
        webHome: webHomeTranslations.en,
        sidebar:sidebarTranslations.en,
        footer:footerTranslations.en,
      },
      fr: {
        webHome: webHomeTranslations.fr,
        sidebar:sidebarTranslations.fr,
        footer:footerTranslations.fr,
      },
    },
    
    lng: getDeviceLanguage(),
    fallbackLng: "fr",
    interpolation: {
      escapeValue: false, 
    },
  });

export default i18n;
