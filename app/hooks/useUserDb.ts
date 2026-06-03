// Re-exports the global user context so all existing callers work unchanged.
// Update happens in one place (UserContext) and propagates everywhere.
export { useUserContext as useUserDb } from "@/contexts/UserContext";
