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
  const month = now.toLocaleDateString("en-US", { month: "short" }).toLowerCase();
  const day = now.getDate();
  const time = now
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    .toLowerCase()
    .replace(/[:\s]/g, "");
  return `clorb-${month}-${day}-${time}`;
}
