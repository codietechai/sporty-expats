import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

// Mirrors web purchaseData.ts — replace with real API call when market endpoint is ready
interface PurchaseItem {
    title: string;
    condition: string;
    description: string;
    daysPosted: string;
    views: string;
    price: string;
    date: string;
}

const PURCHASE_DATA: PurchaseItem[] = [
    {
        title: "Item Name Can Take Up To Two Lines",
        condition: "Used",
        description: "Description: can take up to two lines. Continues on the full view...",
        daysPosted: "6 months old",
        views: "13 views",
        price: "300",
        date: "Sep 23rd, 2024",
    },
    {
        title: "Item Name Can Take Up To Two Lines",
        condition: "Used",
        description: "Description: can take up to two lines. Continues on the full view...",
        daysPosted: "6 months old",
        views: "13 views",
        price: "300",
        date: "Sep 23rd, 2024",
    },
    {
        title: "Item Name Can Take Up To Two Lines",
        condition: "Brand New",
        description: "Description: can take up to two lines. Continues on the full view...",
        daysPosted: "6 months old",
        views: "13 views",
        price: "300",
        date: "Sep 23rd, 2024",
    },
    {
        title: "Item Name Can Take Up To Two Lines",
        condition: "Brand New",
        description: "Description: can take up to two lines. Continues on the full view...",
        daysPosted: "6 months old",
        views: "13 views",
        price: "300",
        date: "Sep 23rd, 2024",
    },
];

const PurchaseCard = ({ item }: { item: PurchaseItem }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.85}>
        {/* Image placeholder — no real image URL yet */}
        <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={36} color="#374151" />
        </View>
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
            <View style={styles.row}>
                <Ionicons name="calendar-outline" size={12} color="#6b7280" />
                <Text style={styles.dateText}>{item.date}</Text>
            </View>
        </View>
    </TouchableOpacity>
);

const MyPurchases = () => {
    return (
        <ScrollView contentContainerStyle={styles.container}>
            {PURCHASE_DATA.map((item, index) => (
                <PurchaseCard key={index} item={item} />
            ))}
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
    imagePlaceholder: {
        width: "100%",
        height: 169,
        backgroundColor: "#1f2937",
        alignItems: "center",
        justifyContent: "center",
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
    dateText: { color: "#6b7280", fontSize: 11 },
});

export default MyPurchases;
