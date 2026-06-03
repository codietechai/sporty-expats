import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

// Item Sales mirrors the web's MarketCardBoard which uses purchaseData
// Both Item Sales and My Purchases show the same market card layout on web
// Static placeholder — replace with real market API call when available
interface MarketItem {
  image: string;
  title: string;
  condition: string;
  description: string;
  daysPosted: string;
  views: string;
  price: string;
}

const WEB_IMAGE_BASE_URL = "https://staging.sportyexpats.fr";

const MARKET_DATA: MarketItem[] = [
  {
    image: `${WEB_IMAGE_BASE_URL}/images/dashboardImages/myevent1.png`,
    title: "Item Name Can Take Up To Two Lines",
    condition: "Used",
    description: "Description: can take up to two lines. Continues on the full view...",
    daysPosted: "6 months old",
    views: "13 views",
    price: "300",
  },
  {
    image: `${WEB_IMAGE_BASE_URL}/images/dashboardImages/myevent1.png`,
    title: "Item Name Can Take Up To Two Lines",
    condition: "Used",
    description: "Description: can take up to two lines. Continues on the full view...",
    daysPosted: "6 months old",
    views: "13 views",
    price: "300",
  },
  {
    image: `${WEB_IMAGE_BASE_URL}/images/dashboardImages/myevent3.png`,
    title: "Item Name Can Take Up To Two Lines",
    condition: "Brand New",
    description: "Description: can take up to two lines. Continues on the full view...",
    daysPosted: "6 months old",
    views: "13 views",
    price: "300",
  },
  {
    image: `${WEB_IMAGE_BASE_URL}/images/dashboardImages/myevent2.png`,
    title: "Item Name Can Take Up To Two Lines",
    condition: "Brand New",
    description: "Description: can take up to two lines. Continues on the full view...",
    daysPosted: "6 months old",
    views: "13 views",
    price: "300",
  },
];

const MarketCard = ({ item }: { item: MarketItem }) => (
  <TouchableOpacity style={styles.card} activeOpacity={0.85}>
    {/* Image placeholder — no real image URL yet */}
    <Image source={{ uri: item.image }} style={styles.cardImage} resizeMode="cover" />
    <View style={styles.cardBody}>
      <View style={styles.row}>
        <Text style={styles.conditionLabel}>Condition:</Text>
        <Text style={styles.conditionValue}>{item.condition}</Text>
      </View>
      <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
      <Text style={styles.cardDesc} numberOfLines={2}>
        {item.description.substring(0, 60)}
        {item.description.length > 60 ? "..." : ""}
      </Text>
      <View style={styles.row}>
        <Text style={styles.metaText}>{item.daysPosted}</Text>
        <Text style={styles.metaSep}>·</Text>
        <Text style={styles.metaText}>{item.views}</Text>
      </View>
      <View style={styles.row}>
        <Ionicons name="cash-outline" size={14} color="#2FA566" />
        <Text style={styles.priceLabel}>Price:</Text>
        <Text style={styles.priceValue}>{item.price}</Text>
      </View>
    </View>
  </TouchableOpacity>
);

const ItemSales = () => {
  const navigation = useNavigation<any>();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {MARKET_DATA.map((item, index) => (
        <MarketCard key={index} item={item} />
      ))}
      <TouchableOpacity
        style={styles.marketBtn}
        onPress={() => navigation.navigate("Market")}
      >
        <Ionicons name="storefront-outline" size={18} color="#fff" />
        <Text style={styles.marketBtnText}>Go to Market</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 12, paddingBottom: 32, gap: 12 },
  card: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  cardImage: {
    width: "100%",
    height: 169,
    backgroundColor: "#1e1e1e",
  },
  cardBody: { padding: 12, gap: 6 },
  row: { flexDirection: "row", alignItems: "center", gap: 4 },
  conditionLabel: { color: "#2FA566", fontSize: 14, fontWeight: "700" },
  conditionValue: { color: "#fff", fontSize: 14, fontWeight: "600" },
  cardTitle: { color: "#fff", fontSize: 14, fontWeight: "600", lineHeight: 20 },
  cardDesc: { color: "rgba(255,255,255,0.6)", fontSize: 12, lineHeight: 17 },
  metaText: { color: "rgba(255,255,255,0.6)", fontSize: 12 },
  metaSep: { color: "rgba(255,255,255,0.3)", fontSize: 12 },
  priceLabel: { color: "#2FA566", fontSize: 12, fontWeight: "500" },
  priceValue: { color: "rgba(255,255,255,0.6)", fontSize: 12 },
  marketBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
    backgroundColor: "#166534",
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#2ecc71",
  },
  marketBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});

export default ItemSales;
