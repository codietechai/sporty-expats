import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  ScrollView,
  Animated,
} from "react-native";
import { Stack } from "expo-router";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const { width } = Dimensions.get("window");

import Yoga from "@/assets/images/yoga.jpg";
// import Soccer from "@/assets/images/soccer.jpg";
import Group from "@/assets/images/group.jpg";
import Basketball from "@/assets/images/basketball.jpg";
import PinkSoccer from "@/assets/images/pinksoccer.jpg";
import Parade from "@/assets/images/parade.jpg";
import Runners from "@/assets/images/runners.jpg";
import Kickboxing from "@/assets/images/kickboxing.png";
import Hoop from "@/assets/images/hoop.png";
import Horse from "@/assets/images/horse.jpg";
import YogaPose from "@/assets/images/yogapose.jpg";

export default function Event() {
  const marqueeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startAnimation = () => {
      marqueeAnim.setValue(0);
      Animated.loop(
        Animated.timing(marqueeAnim, {
          toValue: -width,
          duration: 10000,
          useNativeDriver: true,
        })
      ).start();
    };

    startAnimation();
  }, []);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ flex: 1, backgroundColor: "#0d0d0d" }}>
        <Header />
        <ScrollView style={styles.container}>
      {/* Section 1: Events for Professionals */}
      <Text style={styles.heading}>
        <Text style={styles.highlight}>EVENTS </Text>
        FOR{"\n"}PROFESSIONALS{"\n"}AND ENTHUSIASTS
      </Text>

      <View style={styles.svgOverlapContainer}>
        <Image
          source={Kickboxing}
          style={styles.kickboxingImage}
          resizeMode="contain"
        />
        <Image source={Hoop} style={styles.hoopImage} resizeMode="contain" />
      </View>

      {/* Section 2: Marquee Animation */}
      {/* <View style={styles.marqueeContainer}>
        <Animated.Text
          numberOfLines={1}
          style={[
            styles.marqueeText,
            {
              transform: [{ translateX: marqueeAnim }],
              width: width * 2,
            },
          ]}
        >
          {"8+ EVENTS EACH MONTH     ".repeat(20)}
        </Animated.Text>
      </View> */}

      <View style={styles.sectionTwoContainer}>
        {/* Both marquees stacked */}
        <View style={styles.marqueeStack}>
          <Animated.Text
            numberOfLines={1}
            style={[
              styles.marqueeTextBehind,
              {
                transform: [{ translateX: marqueeAnim }],
                width: width * 2,
              },
            ]}
          >
            {"8+ EVENTS EACH MONTH     ".repeat(20)}
          </Animated.Text>

          <Animated.Text
            numberOfLines={1}
            style={[
              styles.marqueeTextOverlay,
              {
                transform: [{ translateX: marqueeAnim }],
                width: width * 2,
              },
            ]}
          >
            {"8+ EVENTS EACH MONTH     ".repeat(20)}
          </Animated.Text>
        </View>

        {/* Image stack to overlay on marquees */}
        <View style={styles.imageStack}>
          <View style={styles.imageWrapperBehind}>
            <Image source={YogaPose} style={styles.rowImage} />
          </View>

          <View style={styles.imageWrapperFront}>
            <Image source={Horse} style={styles.rowImage} />
          </View>
        </View>
      </View>

      {/* Section 3: Organise Your Own Activities */}
      <View style={styles.activitiesHeading}>
        <Text style={styles.activitiesLine1}>ORGANISE YOUR</Text>
        <Text style={styles.activitiesLine2}>
          OWN ::: <Text style={styles.activitiesGreen}>ACTIVITIES</Text>
        </Text>
      </View>

      <View style={styles.imageGrid}>
        <View style={styles.leftColumn}>
          <Image source={Yoga} style={styles.largeImage} />
        </View>
        <View style={styles.rightColumn}>
          <Image source={Group} style={styles.smallTopImage} />
          <Image source={Basketball} style={styles.smallBottomImage} />
        </View>
      </View>

      <View style={styles.imageGridRow}>
        <Image source={PinkSoccer} style={styles.gridImage} />
        <Image source={Parade} style={styles.gridImage} />
      </View>

      {/* Section 4: Network and Community */}
      <Text style={styles.sectionTitle}>NETWORK AND TRUE COMMUNITY</Text>
      <Image source={Runners} style={styles.fullWidthImage} />
      <Footer />
    </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#0d0d0d",
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  heading: {
    color: "#ffffff",
    fontSize: 30,
    fontWeight: "bold",
    lineHeight: 34,
    marginBottom: 20,
  },
  highlight: {
    color: "#2ecc71",
  },
  svgOverlapContainer: {
    height: width * 0.5,
    justifyContent: "flex-start",
    alignItems: "center",
    marginBottom: 24,
    position: "relative",
  },

  kickboxingImage: {
    width: width * 0.55,
    height: width * 0.55,
    borderRadius: 20,
    position: "absolute",
    zIndex: 0,
    left: width / 2 - width * 0.175, // center horizontally
    top: 0,
  },

  hoopImage: {
    width: width * 0.55,
    height: width * 0.55,
    borderRadius: 20,
    position: "absolute",
    zIndex: 1,
    left: width / 2 - width * 0.175 - 80, // move slightly left to overlap
    top: 0,
  },

  marqueeContainer: {
    height: 36,
    overflow: "hidden",
    justifyContent: "center",
    marginBottom: 16,
  },
  marqueeText: {
    color: "#2ecc71",
    fontSize: 18,
    fontWeight: "bold",
  },
  imageRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 12,
  },
  // rowImage: {
  //   flex: 1,
  //   height: width * 0.42,
  //   borderRadius: 14,
  // },
  rowImage1: {
    flex: 1,
    height: width * 0.42,
    borderRadius: 14,
    marginTop: 100,
    zIndex: 1,
  },
  rowImage2: {
    flex: 1,
    height: width * 0.42,
    borderRadius: 14,
    marginBottom: 100,
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 30,
    fontWeight: "bold",
    lineHeight: 30,
    marginBottom: 18,
  },
  subHighlight: {
    color: "#2ecc71",
  },
  // imageGrid: {
  //   flexDirection: "row",
  //   flexWrap: "wrap",
  //   justifyContent: "space-between",
  //   marginBottom: 32,
  //   gap: 1,
  // },
  gridImageYoga: {
    width: "60%",
    marginBottom: 4,
    height: width * 0.58,
    borderRadius: 12,
  },
  gridImage2: {
    marginBottom: 4,
    width: "39%",
    height: (width * 0.68) / 2,
    borderRadius: 12,
  },
  fullWidthImage: {
    width: "100%",
    height: width * 0.58,
    borderRadius: 12,
    marginBottom: 36,
  },
  imageGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  leftColumn: {
    width: "60%",
    marginRight: 8,
  },

  rightColumn: {
    width: "40%",
    justifyContent: "space-between",
  },

  largeImage: {
    width: "100%",
    height: width * 0.58,
    borderRadius: 12,
    marginBottom: 4,
  },

  smallTopImage: {
    width: "100%",
    height: width * 0.28,
    borderRadius: 12,
    marginBottom: 8,
  },

  smallBottomImage: {
    width: "100%",
    height: width * 0.28,
    borderRadius: 12,
  },

  imageGridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
  },

  gridImage: {
    width: (width - 48) / 2,
    height: ((width - 48) / 2) * 0.66,
    borderRadius: 12,
  },
  sectionTwoContainer: {
    position: "relative",
    marginTop: 40,
    height: width * 0.9 + 32, // enough height to stack images
  },

  marqueeStack: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: width * 0.9,
    justifyContent: "center",
    alignItems: "center",
  },

  marqueeTextBehind: {
    position: "absolute",
    top: width * 0.52, // around lower area of YogaPose
    color: "#2ecc71",
    fontSize: 18,
    fontWeight: "bold",
    zIndex: 1,
  },

  marqueeTextOverlay: {
    position: "absolute",
    top: width * 0.2, // top over Horse
    color: "#2ecc71",
    fontSize: 18,
    fontWeight: "bold",
    zIndex: 100,
  },

  imageStack: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 4,
  },

  imageWrapperBehind: {
    flex: 1,
    height: width * 0.42,
    borderRadius: 14,
    overflow: "hidden",
    zIndex: 5,
    marginTop: 120,
  },

  imageWrapperFront: {
    flex: 1,
    height: width * 0.42,
    borderRadius: 14,
    overflow: "hidden",
    zIndex: 15,
    // marginBottom: 100,
  },

  rowImage: {
    width: "100%",
    height: "100%",
    borderRadius: 14,
  },
  activitiesHeading: {
    marginBottom: 24,
  },

  activitiesLine1: {
    color: "#ffffff",
    fontSize: 30,
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 2,
  },

  activitiesLine2: {
    color: "#ffffff",
    fontSize: 30,
    fontWeight: "bold",
    letterSpacing: 1,
    textAlign: "right", // 👈 Ensures it touches the right edge
    width: "100%",
  },

  activitiesGreen: {
    color: "#2ecc71",
  },
});
