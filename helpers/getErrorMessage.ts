/**
 * Extracts a human-readable error message from any thrown error.
 * Handles axios errors (response.data.error / message / errors array),
 * plain Error objects, and unknown throws.
 */
export function getErrorMessage(err: any, fallback = "Something went wrong. Please try again."): string {
  if (!err) return fallback;

  const data = err?.response?.data;

  if (data) {
    // { error: "Username is already taken" }
    if (typeof data.error === "string") return data.error;

    // { message: "..." }
    if (typeof data.message === "string") return data.message;

    // { errors: ["...", "..."] }  or  { errors: [{ message: "..." }] }
    if (Array.isArray(data.errors)) {
      const msgs = data.errors.map((e: any) =>
        typeof e === "string" ? e : e?.message ?? e?.msg ?? JSON.stringify(e)
      );
      if (msgs.length) return msgs.join("\n");
    }

    // { errors: { field: "..." } }
    if (data.errors && typeof data.errors === "object") {
      const msgs = Object.values(data.errors).filter(Boolean);
      if (msgs.length) return msgs.join("\n");
    }

    // Fallback: stringify data if it's a plain string
    if (typeof data === "string") return data;
  }

  // Plain JS Error or axios network error
  if (typeof err.message === "string") {
    // Strip axios boilerplate like "Request failed with status code 400"
    if (/request failed with status code/i.test(err.message)) return fallback;
    return err.message;
  }

  return fallback;
}
