import React from "react";
import { View, Image, StyleSheet, Text, ScrollView } from "react-native";
import { Stack } from "expo-router";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Market() {
  const totalSlices = 6;
  const sliceWidth = 60;
  const imageHeight = 300;
  const visibleHeights = [160, 240, 200, 180, 260, 150];

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ flex: 1, backgroundColor: "black" }}>
        <Header />
        <ScrollView>
          <Text className="text-white text-5xl uppercase font-oswald pt-14 text-center">
            Agree on a fair price
          </Text>
          <Text className="text-main text-5xl uppercase font-oswald pt-5 text-center">
            Buy and sell in the market
          </Text>

          <View style={styles.imageRow}>
            {visibleHeights.map((visibleHeight, index) => {
              const verticalOffset = (imageHeight - visibleHeight) / 2;
              return (
                <View
                  key={index}
                  style={[
                    styles.sliceMask,
                    {
                      width: sliceWidth,
                      height: visibleHeight,
                    },
                  ]}
                >
                  <Image
                    source={require("@/assets/images/market-football-image.jpg")}
                    style={{
                      width: totalSlices * sliceWidth,
                      height: imageHeight,
                      marginTop: -verticalOffset,
                      transform: [{ translateX: -index * sliceWidth }],
                    }}
                    resizeMode="cover"
                  />
                </View>
              );
            })}
          </View>

          <Text className="text-white text-5xl uppercase font-oswald pt-14 text-center">
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

const styles = StyleSheet.create({
  imageRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 40,
  },
  sliceMask: {
    overflow: "hidden",
    marginHorizontal: 2,
    backgroundColor: "black",
    borderRadius: 8,
  },
});
