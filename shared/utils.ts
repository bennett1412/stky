export function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
}

export function isSubString(value: string, substring: string) {
  const escapedCurrentUrl = substring.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // Escape regex characters
  const regex = new RegExp(`^${escapedCurrentUrl}`);
  return regex.test(value);
}

// Function to update badge text for the active tab
export function updateBadgeText(text: string): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      { action: "updateBadge", text: text },
      (response) => {
        if (response && response.status === "Badge updated") {
          resolve("Badge updated");
        } else {
          reject("Failed to update badge");
        }
      }
    );
  });
}

// Function to get badge text for the active tab
export function getBadgeText(): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: "getBadge" }, (response) => {
      if (response && response.text !== undefined) {
        resolve(response.text);
      } else {
        reject("Failed to retrieve badge text");
      }
    });
  });
}
