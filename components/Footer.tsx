import React from "react";
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useTranslation } from "react-i18next";

const footerItems = [
  { labelKey: "cc_2025" },
  { labelKey: "privacy_policy" },
  { labelKey: "terms_conditions" },
  { labelKey: "about_us" },
  { labelKey: "events" },
  { labelKey: "pricing" },
  { labelKey: "market" },
  { labelKey: "instagram" },
  { labelKey: "facebook" },
  { labelKey: "youtube" },
  { labelKey: "twitter" },
  { labelKey: "phone" },
  { labelKey: "address" },
];

const Footer = () => {
  const { t } = useTranslation('footer');

  return (
    <View className="p-4 mt-8 mx-5">
      <Text className="text-white text-3xl font-bold mb-2 ">
        Sporty <Text className="text-main">Expats</Text>
      </Text>

      <View className="flex flex-wrap flex-col justify-center gap-2 mt-4">
        {footerItems.map((item, index) => (
          <Text key={index} className="text-lg pt-5 text-white ">
            {t(item.labelKey)}
          </Text>
        ))}
      </View>

      <View>
        <Text className="font-oswald text-xs text-white mt-4">
          {t("join_mailing_list")}
        </Text>
        <Text className="text-white">
          {t("mailing_list_text")}
        </Text>
        <TextInput
          placeholder={t("email_placeholder")}
          placeholderTextColor="#d1d5db"
          className="text-xs text-gray-100 mt-5 border border-white focus:border-green-600 px-3 rounded-md"
        />
        <TouchableOpacity
          className="mt-5 mb-20 w-40 items-center justify-center rounded bg-[#166534] px-4 py-3"
        >
          <Text className="text-center text-sm text-white">
            {t("submit_button")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default Footer;
