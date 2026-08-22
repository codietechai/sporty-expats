import { resolveNotificationDestination } from "./navigationRef";

describe("resolveNotificationDestination", () => {
  it("opens the event for the web app invitation URL", () => {
    expect(
      resolveNotificationDestination(
        null,
        "https://sportyexpats-aimmne00a-sparkstrand.vercel.app/en/sportyevents/6a7e98ab426a22d54c03c2aanotification",
      ),
    ).toEqual({
      screen: "EventInfo",
      params: { eventId: "6a7e98ab426a22d54c03c2aa" },
    });
  });

  it("continues to support the legacy event URL", () => {
    expect(resolveNotificationDestination(null, "/events/event-123")).toEqual({
      screen: "EventInfo",
      params: { eventId: "event-123" },
    });
  });

  it("prefers an event id supplied in notification metadata", () => {
    expect(
      resolveNotificationDestination({ eventId: "6a7e98ab426a22d54c03c2aa" }, "/events/other-event"),
    ).toEqual({
      screen: "EventInfo",
      params: { eventId: "6a7e98ab426a22d54c03c2aa" },
    });
  });
});
