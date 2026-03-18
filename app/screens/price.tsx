import AddFeedForm from "@/components/dashboard/AddFeed";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { Button } from "@react-navigation/elements";
import { useNavigation } from "@react-navigation/native";
import { Stack } from "expo-router";
import React from "react";
import { View, Text, Image } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { ClipPath, Defs, G, Path, Rect } from "react-native-svg";

export default function Price() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ flex: 1, backgroundColor: "black" }}>
        <Header />
        <ScrollView style={{ flex: 1 }}>
          <Text className="text-white text-5xl font-oswald pt-14  text-center">
            OUR MEMBERSHIP PLANS
          </Text>
          <Text className="text-white py-3 pl-2 text-center mx-7">
            There’s no sports without community. SportyExpats is a diverse group
            of sports and fitness enthusiasts. So, wether you’re a professional
            athlete or just looking to connect and make new friends who share
            your love for sports... we’ve got you covered.
          </Text>

          <View className="flex flex-row justify-center my-5">
            <Text className="text-main">Monthly </Text>
            <Text className="text-white">| Yearly</Text>
          </View>
          <View className=" mx-6 mt-10 rounded-2xl border border-gray-500 h-[550] ">
            <Text className="text-[#83700F]   text-3xl font-oswald pt-14  pb-2 pl-10">
              BASIC
            </Text>
            <Text className="text-white pl-10">
              There’s no sports without community. SportyExpats is a diverse
              group of sports and fitness enthusiasts. So, wether you’re a
            </Text>
            <Text className="text-white pl-10 text-5xl font-oswald pt-14 pb-9">
              $ 0.00
            </Text>
            <Text className="text-black py-4 rounded-lg font-oswald uppercase bg-white text-center mx-10">
              Get Started
            </Text>
            <View>
              <View className="flex flex-row pl-5 gap-5 border-b border-[#FFFFFF33] py-5 mx-5">
                <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <G clip-path="url(#clip0_157_607)">
                    <Path
                      d="M14.6666 7.38674V8.00007C14.6658 9.43769 14.2003 10.8365 13.3395 11.988C12.4787 13.1394 11.2688 13.9817 9.89016 14.3893C8.51154 14.797 7.03809 14.748 5.68957 14.2498C4.34104 13.7516 3.18969 12.8308 2.40723 11.6248C1.62476 10.4188 1.25311 8.99212 1.3477 7.55762C1.44229 6.12312 1.99806 4.75762 2.93211 3.66479C3.86615 2.57195 5.12844 1.81033 6.53071 1.4935C7.93298 1.17668 9.4001 1.32163 10.7133 1.90674"
                      stroke="white"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <Path
                      d="M14.6667 2.66675L8 9.34008L6 7.34008"
                      stroke="white"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </G>
                  <Defs>
                    <ClipPath id="clip0_157_607">
                      <Rect width="16" height="16" fill="white" />
                    </ClipPath>
                  </Defs>
                </Svg>

                <Text className="text-white">
                  There’s no sports without community. SportyExpats is a d
                </Text>
              </View>
              <View className="flex flex-row gap-5 pl-5 border-b border-[#FFFFFF33] py-5 mx-5">
                <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <G clip-path="url(#clip0_157_607)">
                    <Path
                      d="M14.6666 7.38674V8.00007C14.6658 9.43769 14.2003 10.8365 13.3395 11.988C12.4787 13.1394 11.2688 13.9817 9.89016 14.3893C8.51154 14.797 7.03809 14.748 5.68957 14.2498C4.34104 13.7516 3.18969 12.8308 2.40723 11.6248C1.62476 10.4188 1.25311 8.99212 1.3477 7.55762C1.44229 6.12312 1.99806 4.75762 2.93211 3.66479C3.86615 2.57195 5.12844 1.81033 6.53071 1.4935C7.93298 1.17668 9.4001 1.32163 10.7133 1.90674"
                      stroke="white"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <Path
                      d="M14.6667 2.66675L8 9.34008L6 7.34008"
                      stroke="white"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </G>
                  <Defs>
                    <ClipPath id="clip0_157_607">
                      <Rect width="16" height="16" fill="white" />
                    </ClipPath>
                  </Defs>
                </Svg>

                <Text className="text-white">
                  There’s no sports without community. SportyExpats is a d
                </Text>
              </View>
            </View>
          </View>

          <View className=" mx-6 mt-10 rounded-2xl border border-gray-500 h-[550] ">
            <Text className="text-[#762E05] uppercase  text-3xl font-oswald pt-14  pb-2 pl-10">
              Premium
            </Text>
            <Text className="text-white pl-10">
              There’s no sports without community. SportyExpats is a diverse
              group of sports and fitness enthusiasts. So, wether you’re a
            </Text>
            <Text className="text-white pl-10 text-5xl font-oswald pt-14 pb-9">
              $ 10.00
            </Text>
            <Text className="text-black py-4 rounded-lg font-oswald uppercase bg-white text-center mx-10">
              Get Started
            </Text>
            <View>
              <View className="flex flex-row pl-5 gap-5 border-b border-[#FFFFFF33] py-5 mx-5">
                <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <G clip-path="url(#clip0_157_607)">
                    <Path
                      d="M14.6666 7.38674V8.00007C14.6658 9.43769 14.2003 10.8365 13.3395 11.988C12.4787 13.1394 11.2688 13.9817 9.89016 14.3893C8.51154 14.797 7.03809 14.748 5.68957 14.2498C4.34104 13.7516 3.18969 12.8308 2.40723 11.6248C1.62476 10.4188 1.25311 8.99212 1.3477 7.55762C1.44229 6.12312 1.99806 4.75762 2.93211 3.66479C3.86615 2.57195 5.12844 1.81033 6.53071 1.4935C7.93298 1.17668 9.4001 1.32163 10.7133 1.90674"
                      stroke="white"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <Path
                      d="M14.6667 2.66675L8 9.34008L6 7.34008"
                      stroke="white"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </G>
                  <Defs>
                    <ClipPath id="clip0_157_607">
                      <Rect width="16" height="16" fill="white" />
                    </ClipPath>
                  </Defs>
                </Svg>

                <Text className="text-white">
                  There’s no sports without community. SportyExpats is a d
                </Text>
              </View>
              <View className="flex flex-row gap-5 pl-5 border-b border-[#FFFFFF33] py-5 mx-5">
                <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <G clip-path="url(#clip0_157_607)">
                    <Path
                      d="M14.6666 7.38674V8.00007C14.6658 9.43769 14.2003 10.8365 13.3395 11.988C12.4787 13.1394 11.2688 13.9817 9.89016 14.3893C8.51154 14.797 7.03809 14.748 5.68957 14.2498C4.34104 13.7516 3.18969 12.8308 2.40723 11.6248C1.62476 10.4188 1.25311 8.99212 1.3477 7.55762C1.44229 6.12312 1.99806 4.75762 2.93211 3.66479C3.86615 2.57195 5.12844 1.81033 6.53071 1.4935C7.93298 1.17668 9.4001 1.32163 10.7133 1.90674"
                      stroke="white"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <Path
                      d="M14.6667 2.66675L8 9.34008L6 7.34008"
                      stroke="white"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </G>
                  <Defs>
                    <ClipPath id="clip0_157_607">
                      <Rect width="16" height="16" fill="white" />
                    </ClipPath>
                  </Defs>
                </Svg>

                <Text className="text-white">
                  There’s no sports without community. SportyExpats is a d
                </Text>
              </View>
            </View>
          </View>

          <View className=" mx-6 mt-10 rounded-2xl border border-gray-500 h-[550] ">
            <Text className="text-[#762E05] uppercase  text-3xl font-oswald pt-14  pb-2 pl-10">
              VIP
            </Text>
            <Text className="text-white pl-10">
              There’s no sports without community. SportyExpats is a diverse
              group of sports and fitness enthusiasts. So, wether you’re a
            </Text>
            <Text className="text-white pl-10 text-5xl font-oswald pt-14 pb-9">
              $ 50.00
            </Text>
            <Text className="text-black py-4 rounded-lg font-oswald uppercase bg-white text-center mx-10">
              Get Started
            </Text>
            <View>
              <View className="flex flex-row pl-5 gap-5 border-b border-[#FFFFFF33] py-5 mx-5">
                <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <G clip-path="url(#clip0_157_607)">
                    <Path
                      d="M14.6666 7.38674V8.00007C14.6658 9.43769 14.2003 10.8365 13.3395 11.988C12.4787 13.1394 11.2688 13.9817 9.89016 14.3893C8.51154 14.797 7.03809 14.748 5.68957 14.2498C4.34104 13.7516 3.18969 12.8308 2.40723 11.6248C1.62476 10.4188 1.25311 8.99212 1.3477 7.55762C1.44229 6.12312 1.99806 4.75762 2.93211 3.66479C3.86615 2.57195 5.12844 1.81033 6.53071 1.4935C7.93298 1.17668 9.4001 1.32163 10.7133 1.90674"
                      stroke="white"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <Path
                      d="M14.6667 2.66675L8 9.34008L6 7.34008"
                      stroke="white"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </G>
                  <Defs>
                    <ClipPath id="clip0_157_607">
                      <Rect width="16" height="16" fill="white" />
                    </ClipPath>
                  </Defs>
                </Svg>

                <Text className="text-white">
                  There’s no sports without community. SportyExpats is a d
                </Text>
              </View>
              <View className="flex flex-row gap-5 pl-5 border-b border-[#FFFFFF33] py-5 mx-5">
                <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <G clip-path="url(#clip0_157_607)">
                    <Path
                      d="M14.6666 7.38674V8.00007C14.6658 9.43769 14.2003 10.8365 13.3395 11.988C12.4787 13.1394 11.2688 13.9817 9.89016 14.3893C8.51154 14.797 7.03809 14.748 5.68957 14.2498C4.34104 13.7516 3.18969 12.8308 2.40723 11.6248C1.62476 10.4188 1.25311 8.99212 1.3477 7.55762C1.44229 6.12312 1.99806 4.75762 2.93211 3.66479C3.86615 2.57195 5.12844 1.81033 6.53071 1.4935C7.93298 1.17668 9.4001 1.32163 10.7133 1.90674"
                      stroke="white"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                    <Path
                      d="M14.6667 2.66675L8 9.34008L6 7.34008"
                      stroke="white"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </G>
                  <Defs>
                    <ClipPath id="clip0_157_607">
                      <Rect width="16" height="16" fill="white" />
                    </ClipPath>
                  </Defs>
                </Svg>

                <Text className="text-white">
                  There’s no sports without community. SportyExpats is a d
                </Text>
              </View>
            </View>
          </View>

          <Text className="text-white text-5xl font-oswald pt-14  text-center uppercase">
            Network and true community
          </Text>
          <View className="flex flex-row justify-center">
            <Image
              source={require("@/assets/images/network-image.png")}
              style={{ width: 400, height: 400, resizeMode: "contain" }}
            />
          </View>

          <Footer />
        </ScrollView>
      </View>
    </>
  );
}
