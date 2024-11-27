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
