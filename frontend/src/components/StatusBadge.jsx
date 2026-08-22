import { statusLabel } from "../utils/format.js";

const tone = (status = "") => {
  if (["delivered", "accepted", "ok"].includes(status)) return "ok";
  if (["requested", "open", "sourcing", "awaiting_farmers", "partially_accepted"].includes(status)) return "warn";
  if (["in_transit", "handed_over", "picked_up", "en_route_delivery", "en_route_pickup"].includes(status)) return "info";
  if (["rejected", "cancelled"].includes(status)) return "hot";
  return "";
};

export default function StatusBadge({ status }) {
  return <span className={`badge ${tone(status)}`}>{statusLabel(status)}</span>;
}
