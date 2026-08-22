export const money = (value = 0) =>
  `Rs ${Number(value || 0).toLocaleString("en-NP", { maximumFractionDigits: 0 })}`;

export const kg = (value = 0, unit = "kg") => `${Number(value || 0)} ${unit}`;

export const when = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-NP", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const statusLabel = (status = "") =>
  status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

export const roleHome = (role) => {
  if (role === "farmer") return "/farmer";
  if (role === "driver") return "/driver";
  return "/retailer";
};
