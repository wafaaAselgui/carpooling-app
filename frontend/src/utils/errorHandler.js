/**
 * Converts raw Axios / Laravel API errors into clean, user-friendly messages.
 */
export function getFriendlyError(err, fallback = "Something went wrong. Please try again.") {
  // 1. Network / Server offline
  if (!err?.response) {
    return "Unable to reach the server. Please check your connection and try again.";
  }

  const { status, data } = err.response;

  // 2. Laravel Validation Errors (422) -> return first field error cleanly
  if (status === 422 && data?.errors) {
    const firstField = Object.keys(data.errors)[0];
    if (firstField && Array.isArray(data.errors[firstField])) {
      return data.errors[firstField][0];
    }
  }

  // 3. Common HTTP status fallbacks
  if (status === 401) {
    return data?.message && !isRawServerError(data.message)
      ? data.message
      : "Invalid email or password.";
  }

  if (status === 403) {
    return data?.message && !isRawServerError(data.message)
      ? data.message
      : "You don't have permission to perform this action.";
  }

  if (status === 404) {
    return "The requested resource could not be found.";
  }

  if (status === 429) {
    return "Too many attempts. Please wait a moment and try again.";
  }

  // 4. Inspect backend message and block raw PHP / SQL / Stack Trace leaks
  const rawMessage = data?.message || "";
  if (rawMessage && !isRawServerError(rawMessage)) {
    return rawMessage;
  }

  // 5. Safe fallback for 500 Internal Server Errors
  return fallback;
}

function isRawServerError(msg) {
  const technicalPatterns = [
    /attempt to read property/i,
    /sqlstate/i,
    /undefined variable/i,
    /undefined array key/i,
    /call to a member function/i,
    /syntax error/i,
    /exception/i,
    /stack trace/i,
    /on null/i,
  ];
  return technicalPatterns.some((pattern) => pattern.test(msg));
}