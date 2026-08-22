import { backendClient } from "@/client/backendClient";

export type ComplaintType =
  | "Payment"
  | "EventRegistration"
  | "RefundRequest"
  | "OffensiveContent"
  | "EventCreation"
  | "ReportUser";

export interface ComplaintPayload {
  title: string;
  description: string;
  type: ComplaintType;
  status: "Pending";
  priority: "Medium";
  userId: string;
}

export async function submitComplaint(payload: ComplaintPayload): Promise<void> {
  await backendClient.post("/complaints", payload);
}
