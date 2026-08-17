import i18n from "@/translations/i18n";
import React, { useCallback, useEffect, useState } from "react";
import {
    View, Text, Image, ScrollView, TouchableOpacity,
    StyleSheet, ActivityIndicator, Alert, Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { WebView } from "react-native-webview";
import { getEventById } from "@/client/endpoints/events/getEventById";
import { getAttendee, withdrawParticipation, AttendeeData } from "@/client/endpoints/events/eventRegistration";
import { useUserDb } from "@/app/hooks/useUserDb";
import { normalizeMediaUrl } from "@/helpers/normalizeMediaUrl";
import { useNotificationsContext } from "@/contexts/NotificationsContext";
import type { Event } from "@/client/endpoints/events/types";

function formatDate(dateString: string): string {
    return new Intl.DateTimeFormat("en-US", {
        month: "short", day: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit", hour12: false,
    }).format(new Date(dateString)).replace(",", ".");
}

function isPast(dateString: string) { return new Date(dateString) < new Date(); }

function isApproaching(dateString: string) {
    const diff = new Date(dateString).getTime() - Date.now();
    return diff > 0 && diff < 48 * 60 * 60 * 1000;
}

function DeadlineBadge({ date }: { date: string }) {
    if (isPast(date)) return <View style={styles.badgeDanger}><Text style={styles.badgeDangerText}>Expired</Text></View>;
    if (isApproaching(date)) return <View style={styles.badgeWarn}><Text style={styles.badgeWarnText}>Closing soon</Text></View>;
    return null;
}

export default function EventInfoScreen({ route }: any) {
    const navigation = useNavigation<any>();
    const eventFromRoute: Event | undefined = route?.params?.event;
    const eventIdParam: string | undefined = route?.params?.eventId;

    const [event, setEvent] = useState<Event | null>(eventFromRoute ?? null);
    const [loading, setLoading] = useState(!eventFromRoute);
    const [attendee, setAttendee] = useState<AttendeeData | null>(null);
    const [isOrganizer, setIsOrganizer] = useState(false);
    const [statusLoading, setStatusLoading] = useState(true);
    const [withdrawing, setWithdrawing] = useState(false);
    // Preserve ticket count at the moment of registration — the backend may
    // return ticketsAssigned as 0 or null after status flips to "Withdrew"
    const [ticketsAtRegistration, setTicketsAtRegistration] = useState<number>(1);

    const { userDb } = useUserDb();
    const { unreadCount } = useNotificationsContext();
    const userId: string | undefined = userDb?.data?.id ?? userDb?.id;
    const username: string | undefined = userDb?.data?.username ?? userDb?.username;

    // If only an eventId was passed (e.g. from a notification), fetch the full event
    useEffect(() => {
        if (!eventFromRoute && eventIdParam) {
            setLoading(true);
            getEventById(eventIdParam)
                .then((e) => { setEvent(e); setLoading(false); })
                .catch(() => setLoading(false));
        }
    }, [eventIdParam]);

    // Refresh event data to get latest availableTickets
    useEffect(() => {
        if (eventFromRoute) {
            getEventById(eventFromRoute.id)
                .then(setEvent)
                .catch(() => setEvent(eventFromRoute));
        }
    }, [eventFromRoute?.id]);

    // Fetch attendee record every time this screen is focused
    // This ensures buttons update after registration or refund flows
    useFocusEffect(
        useCallback(() => {
            if (!userId || !event?.id) {
                setStatusLoading(false);
                return;
            }
            if (username && event.organizers?.includes(username)) {
                setIsOrganizer(true);
                setStatusLoading(false);
                return;
            }
            setStatusLoading(true);
            // Also refresh event to get latest availableTickets
            getEventById(event.id)
                .then(setEvent)
                .catch(() => {});
            getAttendee(userId, event.id)
                .then((data) => {
                    setAttendee(data);
                    // Always capture the real ticket count from the latest attendee record.
                    // Even "Withdrew" records keep ticketsAssigned so the refund screen shows
                    // the correct number. Fall back to previous snapshot only if the API
                    // returns 0 or null (shouldn't happen but defensive).
                    if (data && (data.ticketsAssigned ?? 0) > 0) {
                        setTicketsAtRegistration(data.ticketsAssigned);
                    }
                })
                .catch(() => setAttendee(null))
                .finally(() => setStatusLoading(false));
        }, [userId, event?.id, username])
    );

    const isRegistered = !!attendee && attendee.attendantStatus !== "Withdrew";
    const hasWithdrawn = attendee?.attendantStatus === "Withdrew";

    const handleWithdraw = () => {
        if (!userId || !event?.id) return;
        Alert.alert(
            "Withdraw Participation",
            "Are you sure you want to withdraw from this event?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Withdraw",
                    style: "destructive",
                    onPress: async () => {
                        // Snapshot ticket count NOW before status changes
                        if (attendee && (attendee.ticketsAssigned ?? 0) > 0) {
                            setTicketsAtRegistration(attendee.ticketsAssigned);
                        }
                        setWithdrawing(true);
                        try {
                            await withdrawParticipation(userId, event.id);
                            const updated = await getAttendee(userId, event.id);
                            setAttendee(updated);
                            Alert.alert(i18n.t("MessageRequests.done"), "You have withdrawn from this event.");
                        } catch {
                            Alert.alert("Error", "Could not withdraw. Please try again.");
                        } finally {
                            setWithdrawing(false);
                        }
                    },
                },
            ]
        );
    };

    const formattedPrice = new Intl.NumberFormat("en-US", {
        style: "currency", currency: "EUR",
    }).format(event?.ticketPrice ?? 0);

    const canRegister = !isOrganizer
        && !!event?.endDate && new Date(event.endDate) > new Date()
        && !!event?.paymentDeadline && new Date(event.paymentDeadline) > new Date()
        && (event?.availableTickets ?? 0) > 0;

    const isSoldOut = (event?.availableTickets ?? 0) === 0;

    if (loading) {
        return (
            <SafeAreaView style={styles.safe}>
                <View style={styles.centered}>
                    <ActivityIndicator size="large" color="#2ecc71" />
                </View>
            </SafeAreaView>
        );
    }

    if (!event) {
        return (
            <SafeAreaView style={styles.safe}>
                <View style={styles.centered}>
                    <Text style={styles.errorText}>Event not found.</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />
            <SafeAreaView style={styles.safe} edges={["top"]}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.navigate("Events List" as any)} style={styles.backBtn} hitSlop={8}>
                        <Ionicons name="arrow-back" size={22} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{i18n.t("NavBar.Event")}</Text>
                    <TouchableOpacity style={styles.bellBtn} hitSlop={8} onPress={() => (navigation as any).navigate("Notifications")}>
                        <Ionicons name="notifications-outline" size={22} color="#fff" />
                        {unreadCount > 0 && (
                            <View style={styles.bellBadge}>
                                <Text style={styles.bellBadgeText}>{unreadCount > 99 ? "99+" : unreadCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
                    {/* Rejection banner */}
                    {event.status === "Rejected" && event.rejectionReason && (
                        <View style={styles.rejectionBanner}>
                            <Ionicons name="alert-circle-outline" size={18} color="#f87171" />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.rejectionLabel}>Rejection Reason</Text>
                                <Text style={styles.rejectionText}>{event.rejectionReason}</Text>
                            </View>
                        </View>
                    )}

                    {/* Cover image */}
                    <View style={styles.coverWrap}>
                        {event.coverImage?.fileUrl ? (
                            <Image source={{ uri: normalizeMediaUrl(event.coverImage.fileUrl) }} style={styles.coverImage} resizeMode="cover" />
                        ) : (
                            <View style={styles.coverPlaceholder}>
                                <Ionicons name="image-outline" size={48} color="#374151" />
                            </View>
                        )}
                        <View style={styles.categoryBadge}>
                            <Text style={styles.categoryBadgeText}>{event.category}</Text>
                        </View>
                        <View style={styles.visibilityBadge}>
                            <Ionicons name={event.visibility === "Public" ? "globe-outline" : "lock-closed-outline"} size={11} color="#9CA3AF" />
                            <Text style={styles.visibilityText}>{event.visibility}</Text>
                        </View>
                    </View>

                    <View style={styles.body}>
                        {/* Title + price */}
                        <View style={styles.titleRow}>
                            <Text style={styles.title}>{event.title}</Text>
                            <View style={styles.priceBadge}>
                                <Text style={styles.priceText}>{event.isPaidEvent ? formattedPrice : "Free"}</Text>
                            </View>
                        </View>

                        {/* Spots remaining */}
                        <View style={styles.spotsRow}>
                            <Ionicons name="ticket-outline" size={16} color="#2ecc71" />
                            <Text style={styles.spotsText}>{event.availableTickets} Spot(s) Remaining</Text>
                        </View>

                        {/* Status */}
                        <View style={styles.statusRow}>
                            <View style={[styles.statusDot, event.status === "Approved" && styles.statusDotActive]} />
                            <Text style={styles.statusText}>{event.status}</Text>
                        </View>

                        <View style={styles.divider} />

                        {/* Attendees */}
                        <View style={styles.section}>
                            <InfoRow icon="people-outline" label={`Max ${event.maxAttendees} Attendee(s)`} />
                            <InfoRow icon="person-outline" label={`Min ${event.minAttendees} Attendee(s)`} />
                        </View>

                        <View style={styles.divider} />

                        {/* Date & Time */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>{i18n.t("CreateEvent.Date&Time")}</Text>
                            <View style={styles.dateRow}>
                                <Ionicons name="calendar-outline" size={15} color="#2ecc71" />
                                <Text style={styles.dateText}>{formatDate(event.startDate)}</Text>
                            </View>
                            <View style={styles.dateRow}>
                                <Ionicons name="time-outline" size={15} color="#2ecc71" />
                                <Text style={styles.dateText}>Ends {formatDate(event.endDate)}</Text>
                            </View>
                        </View>

                        {/* Payment deadline */}
                        {event.paymentDeadline && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>{i18n.t("CreateEvent.paymentDeadline")}</Text>
                                <View style={styles.deadlineRow}>
                                    <Text style={[styles.deadlineText, isPast(event.paymentDeadline) && styles.textDanger, isApproaching(event.paymentDeadline) && styles.textWarn]}>
                                        {formatDate(event.paymentDeadline)}
                                    </Text>
                                    <DeadlineBadge date={event.paymentDeadline} />
                                </View>
                            </View>
                        )}

                        {/* Refund deadline */}
                        {event.refundDeadline && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Refund Deadline</Text>
                                <View style={styles.deadlineRow}>
                                    <Text style={[styles.deadlineText, isPast(event.refundDeadline) && styles.textDanger, isApproaching(event.refundDeadline) && styles.textWarn]}>
                                        {formatDate(event.refundDeadline)}
                                    </Text>
                                    <DeadlineBadge date={event.refundDeadline} />
                                </View>
                            </View>
                        )}

                        <View style={styles.divider} />

                        {/* Location */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>{i18n.t("CreateEvent.EventLocation")}</Text>
                            <View style={styles.locationRow}>
                                <Ionicons name="location-outline" size={15} color="#2ecc71" />
                                <Text style={styles.locationText}>{event.location?.name ?? "—"}</Text>
                            </View>
                            {event.location?.latitude && event.location?.longitude && (
                                <View>
                                    <View style={styles.mapContainer}>
                                        <WebView
                                            style={styles.map}
                                            source={{
                                                html: `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"/><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><style>*{margin:0;padding:0}html,body,#map{width:100%;height:100vh;background:#111}</style></head><body><div id="map"></div><script>var map=L.map('map',{zoomControl:true,scrollWheelZoom:false}).setView([${event.location.latitude},${event.location.longitude}],15);L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{maxZoom:19}).addTo(map);L.marker([${event.location.latitude},${event.location.longitude}]).addTo(map).bindPopup(${JSON.stringify(event.location.name ?? "")}).openPopup();</script></body></html>`,
                                            }}
                                        />
                                    </View>
                                    <TouchableOpacity
                                        style={styles.openMapsBtn}
                                        onPress={() => Linking.openURL(
                                            `https://www.google.com/maps/search/?api=1&query=${event.location.latitude},${event.location.longitude}`
                                        )}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons name="navigate-outline" size={14} color="#2ecc71" />
                                        <Text style={styles.openMapsBtnText}>Open in Maps</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        <View style={styles.divider} />

                        {/* Organizers */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>{i18n.t("CreateEvent.Organizers")}</Text>
                            {event.organizers.map((org, i) => (
                                <Text key={i} style={styles.organizerText}>@{org}</Text>
                            ))}
                        </View>

                        <View style={styles.divider} />

                        {/* Description */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>{i18n.t("CreateEvent.EventDescription")}</Text>
                            <Text style={styles.description}>{event.description}</Text>
                        </View>

                        {/* CTA block — only shown when registration is open */}
                        {canRegister && (
                            <View style={styles.ctaBlock}>
                                {statusLoading ? (
                                    <ActivityIndicator color="#2ecc71" />
                                ) : isSoldOut ? (
                                    <View style={[styles.registerBtn, styles.soldOutBtn]}>
                                        <Text style={styles.registerBtnText}>Event Sold Out</Text>
                                    </View>
                                ) : isRegistered ? (
                                    /* ── Already registered ── */
                                    <View style={styles.registeredBlock}>
                                        <View style={styles.registeredBadge}>
                                            <Ionicons name="checkmark-circle" size={16} color="#2ecc71" />
                                            <Text style={styles.registeredText}>
                                                You're registered · {attendee?.ticketsAssigned ?? ticketsAtRegistration} ticket(s)
                                            </Text>
                                        </View>
                                        <TouchableOpacity
                                            style={[styles.registerBtn, styles.withdrawBtn]}
                                            onPress={handleWithdraw}
                                            disabled={withdrawing}
                                        >
                                            {withdrawing
                                                ? <ActivityIndicator color="#fff" size="small" />
                                                : <Text style={styles.registerBtnText}>Withdraw Participation</Text>
                                            }
                                        </TouchableOpacity>
                                    </View>
                                ) : hasWithdrawn ? (
                                    /* ── Previously withdrew — can re-register ── */
                                    <View style={styles.registeredBlock}>
                                        <View style={[styles.registeredBadge, styles.withdrewBadge]}>
                                            <Ionicons name="close-circle-outline" size={16} color="#f87171" />
                                            <Text style={[styles.registeredText, { color: "#f87171" }]}>
                                                You withdrew from this event
                                            </Text>
                                        </View>
                                        <TouchableOpacity
                                            style={styles.registerBtn}
                                            onPress={() => navigation.navigate("EventRegistration" as any, { event })}
                                        >
                                            <Text style={styles.registerBtnText}>Participate Again</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.registerBtn, styles.refundBtn]}
                                            onPress={() => navigation.navigate("Refund" as any, {
                                                event,
                                                ticketsAssigned: ticketsAtRegistration,
                                            })}
                                        >
                                            <Text style={styles.registerBtnText}>Request Refund</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    /* ── Not registered ── */
                                    <TouchableOpacity
                                        style={styles.registerBtn}
                                        onPress={() => navigation.navigate("EventRegistration" as any, { event })}
                                    >
                                        <Text style={styles.registerBtnText}>Register for this Event</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}

                        <View style={{ height: 40 }} />
                    </View>
                </ScrollView>
            </SafeAreaView>
        </>
    );
}

function InfoRow({ icon, label }: { icon: any; label: string }) {
    return (
        <View style={styles.infoRow}>
            <Ionicons name={icon} size={16} color="#6B7280" />
            <Text style={styles.infoText}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#0d0d0d" },
    centered: { flex: 1, alignItems: "center", justifyContent: "center" },
    errorText: { color: "#EF4444", fontSize: 15 },

    header: {
        flexDirection: "row", alignItems: "center",
        paddingHorizontal: 16, paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: "#1e1e1e",
        backgroundColor: "#111",
    },
    backBtn: {
        width: 38, height: 38, borderRadius: 10,
        backgroundColor: "#1a1a1a", borderWidth: 1, borderColor: "#2a2a2a",
        alignItems: "center", justifyContent: "center",
    },
    bellBtn: {
        width: 38, height: 38, borderRadius: 10,
        backgroundColor: "#1a1a1a", borderWidth: 1, borderColor: "#2a2a2a",
        alignItems: "center", justifyContent: "center",
    },
    bellBadge: {
        position: "absolute", top: -4, right: -4,
        backgroundColor: "#ef4444", borderRadius: 8,
        minWidth: 16, height: 16, paddingHorizontal: 3,
        alignItems: "center", justifyContent: "center",
        borderWidth: 1.5, borderColor: "#0d0d0d",
    },
    bellBadgeText: { color: "#fff", fontSize: 9, fontWeight: "700" },
    headerTitle: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "700", color: "#fff" },

    scroll: { flex: 1 },

    rejectionBanner: {
        flexDirection: "row", alignItems: "flex-start", gap: 10,
        margin: 16, padding: 14, borderRadius: 12,
        borderWidth: 1, borderColor: "rgba(248,113,113,0.4)",
        backgroundColor: "rgba(239,68,68,0.1)",
    },
    rejectionLabel: { fontSize: 11, fontWeight: "700", color: "#f87171", textTransform: "uppercase", letterSpacing: 0.5 },
    rejectionText: { fontSize: 13, color: "#fca5a5", marginTop: 2, lineHeight: 18 },

    coverWrap: { position: "relative", marginHorizontal: 16, marginTop: 16, borderRadius: 14, overflow: "hidden" },
    coverImage: { width: "100%", height: 220, borderRadius: 14 },
    coverPlaceholder: { width: "100%", height: 220, backgroundColor: "#1a1a1a", alignItems: "center", justifyContent: "center", borderRadius: 14 },
    categoryBadge: {
        position: "absolute", top: 12, left: 12,
        backgroundColor: "rgba(0,0,0,0.65)", paddingHorizontal: 10, paddingVertical: 4,
        borderRadius: 20, borderWidth: 1, borderColor: "#2ecc71",
    },
    categoryBadgeText: { color: "#2ecc71", fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
    visibilityBadge: {
        position: "absolute", top: 12, right: 12, flexDirection: "row", alignItems: "center", gap: 4,
        backgroundColor: "rgba(0,0,0,0.65)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20,
    },
    visibilityText: { color: "#9CA3AF", fontSize: 11 },

    body: { paddingHorizontal: 16, paddingTop: 16 },

    titleRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 10 },
    title: { flex: 1, fontSize: 22, fontWeight: "700", color: "#fff", lineHeight: 28 },
    priceBadge: { backgroundColor: "rgba(47,165,102,0.2)", paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
    priceText: { color: "#2ecc71", fontWeight: "700", fontSize: 15 },

    spotsRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
    spotsText: { color: "#9CA3AF", fontSize: 14 },

    statusRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
    statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#374151" },
    statusDotActive: { backgroundColor: "#2ecc71" },
    statusText: { fontSize: 13, color: "#6B7280" },

    divider: { height: 1, backgroundColor: "#1e1e1e", marginVertical: 16 },

    section: { marginBottom: 4 },
    sectionTitle: { fontSize: 15, fontWeight: "700", color: "#fff", marginBottom: 10 },

    infoRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
    infoText: { fontSize: 15, color: "#D1D5DB" },

    dateRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
    dateText: { fontSize: 14, color: "#D1D5DB" },

    deadlineRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    deadlineText: { fontSize: 14, color: "#D1D5DB" },
    textDanger: { color: "#f87171" },
    textWarn: { color: "#fbbf24" },

    badgeDanger: { backgroundColor: "rgba(239,68,68,0.1)", borderWidth: 1, borderColor: "rgba(239,68,68,0.3)", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    badgeDangerText: { fontSize: 10, fontWeight: "700", color: "#f87171", textTransform: "uppercase" },
    badgeWarn: { backgroundColor: "rgba(251,191,36,0.1)", borderWidth: 1, borderColor: "rgba(251,191,36,0.3)", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    badgeWarnText: { fontSize: 10, fontWeight: "700", color: "#fbbf24", textTransform: "uppercase" },

    locationRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
    locationText: { fontSize: 14, color: "#D1D5DB", flex: 1 },
    mapContainer: {
        height: 200, borderRadius: 12, overflow: "hidden",
        borderWidth: 1, borderColor: "#2a2a2a",
    },
    map: { flex: 1, backgroundColor: "#111" },
    openMapsBtn: {
        flexDirection: "row", alignItems: "center", justifyContent: "center",
        gap: 6, marginTop: 8, paddingVertical: 10, borderRadius: 10,
        backgroundColor: "#1a1a1a", borderWidth: 1, borderColor: "#2a2a2a",
    },
    openMapsBtnText: { color: "#2ecc71", fontSize: 13, fontWeight: "600" },

    organizerText: { fontSize: 14, color: "#2ecc71", marginBottom: 4 },

    description: { fontSize: 14, color: "rgba(255,255,255,0.8)", lineHeight: 22 },

    registerBtn: {
        marginTop: 12, backgroundColor: "#166534", borderRadius: 12,
        paddingVertical: 15, alignItems: "center",
        borderWidth: 1, borderColor: "#2ecc71",
    },
    registerBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
    soldOutBtn: { backgroundColor: "#374151", borderColor: "#4B5563" },
    withdrawBtn: { backgroundColor: "#7f1d1d", borderColor: "#ef4444" },
    refundBtn: { backgroundColor: "#1e3a5f", borderColor: "#3b82f6" },
    ctaBlock: { marginTop: 8 },
    registeredBlock: { gap: 0 },
    registeredBadge: {
        flexDirection: "row", alignItems: "center", gap: 6,
        marginTop: 12, marginBottom: 4,
    },
    withdrewBadge: {},
    registeredText: { color: "#2ecc71", fontSize: 14, fontWeight: "600" },
});
