import {
  Image,
  LayoutAnimation,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useState } from "react";
import { useAuth } from "@clerk/clerk-expo";
import { VerticalCarousel } from "@/components/Slider";
import { Stack } from "expo-router";
import { useNavigation } from "@react-navigation/native";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import Footer from "@/components/Footer";
import { useTranslation } from "react-i18next";
import Header from "@/components/Header";

type RootDrawerParamList = {
  Home: undefined;
  Events: undefined;
};

export default function Home() {
  const navigation = useNavigation<DrawerNavigationProp<RootDrawerParamList>>();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const { isSignedIn } = useAuth();

  // When user signs in while Home is active (OAuth redirects to '/' which shows Home first),
  // push them to Dashboard. This navigation is on the Drawer so openDrawer() works correctly.
  React.useEffect(() => {
    if (isSignedIn) {
      navigation.navigate('Dashboard' as any);
    }
  }, [isSignedIn]);

  const toggleAccordion = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveIndex(index === activeIndex ? null : index);
  };

  const accordionData = [
    { title: 'accordion.events', content: 'accordion.events_content' },
    { title: 'accordion.community', content: 'accordion.community_content' },
    { title: 'accordion.competitions', content: 'accordion.competitions_content' },
    { title: 'accordion.host_activities', content: 'accordion.host_activities_content' },
    { title: 'accordion.market', content: 'accordion.market_content' },
  ];

  const { t } = useTranslation('webHome');

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Header />
      <ScrollView
        className="bg-black px-5"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="flex items-center px-4 pt-20">
          <Text className="mb-2 text-3xl font-bold text-white">
            {t("amazing_sports")}
          </Text>
          <Text className="mb-4 text-3xl text-[#166534] font-main">
            {t("strong_community")}
          </Text>
          <TouchableOpacity
            className="mt-5 mb-20 w-40 items-center justify-center rounded bg-[#166534] px-4 py-3"
            onPress={() => navigation.navigate("Events")}
          >
            <Text className="text-center text-sm text-white">
              {t("explore_community")}
            </Text>
          </TouchableOpacity>
        </View>

        <VerticalCarousel />

        <View className="relative">
          <View className="flex items-center px-4 mt-20">
            <View className="flex flex-col">
              <Text className="text-4xl font-bold text-white">
                {t("here_s_a_tour_of")}
              </Text>
              <View>
                <View className="flex flex-col mb-28">
                  <Text className="text-4xl text-white absolute top-10">{t("our")}</Text>
                  <Text className="absolute right-0 top-10 text-[#166534] font-bold text-3xl">{t("activity")}</Text>
                </View>
                <Image
                  source={{ uri: "https://www.sportyexpats.fr/_next/image?url=%2Fimages%2Fdotted.png&w=96&q=75" }}
                  className="absolute top-5 left-20 w-20 h-20 rounded-lg"
                />
              </View>
            </View>
            <Image source={{ uri: "https://www.sportyexpats.fr/_next/image?url=%2Fimages%2Ftestimonial1.png&w=384&q=75" }} className="w-full min-h-52 rounded-lg mb-10" />
            <Image source={{ uri: "https://www.sportyexpats.fr/_next/image?url=%2Fimages%2Ftestimonial2.png&w=828&q=75" }} className="w-full min-h-96 bg-contain rounded-lg mb-10" />
            <Image source={{ uri: "https://www.sportyexpats.fr/_next/image?url=%2Fimages%2Ftestimonial3.png&w=828&q=75" }} className="w-full min-h-[400px] rounded-lg mb-10" />
            <Image source={{ uri: "https://www.sportyexpats.fr/_next/image?url=%2Fimages%2Ftestimonial4.png&w=828&q=75" }} className="w-full min-h-40 rounded-lg mb-10" />
            <Image source={{ uri: "https://www.sportyexpats.fr/_next/image?url=%2Fimages%2Ftestimonial5.png&w=828&q=75" }} className="w-full min-h-60 rounded-lg mb-10" />
            <Image source={{ uri: "https://www.sportyexpats.fr/_next/image?url=%2Fimages%2Ftestimonial6.png&w=828&q=75" }} className="w-full min-h-96 rounded-lg mb-10" />
          </View>
        </View>

        <View>
          <Text className="text-white capitalize text-4xl mb-5">{t("why_sign_up")}</Text>
          <Text className="text-white mb-10">{t("no_sports_community")}</Text>
          <View className="w-full max-h-[500px] rounded-lg overflow-hidden mb-5">
            <Image source={{ uri: "https://www.sportyexpats.fr/_next/image?url=%2Fimages%2Fwhy.png&w=640&q=75" }} className="w-full h-full" resizeMode="cover" />
          </View>
          {accordionData.map((item, index) => (
            <TouchableOpacity
              onPress={() => toggleAccordion(index)}
              key={index}
              className={`px-5 py-10 border-b-2 border-white ${activeIndex === index ? "bg-green-800" : ""}`}
            >
              <Text className="text-white pt-5 text-5xl font-oswald">{t(item.title)}</Text>
              {activeIndex === index && (
                <View className="pt-5 pb-6">
                  <Text className="text-white">{t(item.content)}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}

          <View>
            <Text className="text-white text-4xl font-oswald pt-14 pb-9">
              Sporty<Text className="text-main">Expats</Text> ABOUT US
            </Text>
            <View className="w-full h-[200px] border-b-2 border-white pb-12 overflow-hidden">
              <Image source={{ uri: "https://www.sportyexpats.fr/_next/image?url=%2Fimages%2Fabout.png&w=828&q=75" }} className="w-full h-full" resizeMode="contain" />
            </View>
          </View>
          <View className="pt-10">
            <View className="w-full min-h-[400px] pb-12 overflow-hidden">
              <Image source={{ uri: "https://www.sportyexpats.fr/_next/image?url=%2Fimages%2Fabout-sphere.png&w=1080&q=75" }} className="w-full h-[200px]" resizeMode="contain" />
              <Text className="text-white text-lg text-justify pt-5">{t("sports_without_community_para")}</Text>
            </View>
            <View className="w-full min-h-[400px] pb-12 overflow-hidden">
              <Text className="text-white text-6xl leading-[70px] font-oswald pb-8">{t("NETWORK_AND_TRUE_COMMUNITY")}</Text>
              <Image source={{ uri: "https://www.sportyexpats.fr/_next/image?url=%2Fimages%2Fabout-running.png&w=1080&q=75" }} className="w-full h-[200px]" resizeMode="contain" />
            </View>
          </View>
          <Footer />
        </View>
      </ScrollView>
    </>
  );
}
