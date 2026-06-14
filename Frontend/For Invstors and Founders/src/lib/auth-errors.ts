// Centralized auth error formatter for UI

export function friendlyAuthError(error: any): string {
  if (!error) return "Something went wrong";

  const message =
    error?.response?.data?.message ||
    error?.message ||
    error?.error ||
    "Unknown error";

  // Map common backend errors to clean UI messages
  const map: Record<string, string> = {
    "Invalid credentials": "Incorrect email or password",
    "User not found": "Account does not exist",
    "Token expired": "Session expired, please login again",
    "Unauthorized": "You are not authorized",
    "Network Error": "Check your internet connection",
  };

  return map[message] || message;
}