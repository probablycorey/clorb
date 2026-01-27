export function sanitizeBranchName(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // strip special chars
    .replace(/\s+/g, "-") // spaces to hyphens
    .replace(/-+/g, "-") // collapse multiple hyphens
    .replace(/^-|-$/g, ""); // trim leading/trailing hyphens
}

export function generateBranchName(): string {
  const now = new Date();
  const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const month = months[now.getMonth()];
  const day = now.getDate();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const ampm = hours >= 12 ? "pm" : "am";
  const hour12 = hours % 12 || 12;
  const time = `${hour12}${minutes.toString().padStart(2, "0")}${ampm}`;
  return `clorb-${month}-${day}-${time}`;
}
