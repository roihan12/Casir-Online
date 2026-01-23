import { format } from "date-fns";
import { id } from "date-fns/locale";

export default function formatDate(dateString) {
  if (!dateString) return "-";
  try {
    return format(new Date(dateString), "dd MMMM yyyy, HH:mm", { locale: id });
  } catch {
    return dateString;
  }
}