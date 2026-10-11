import { redirect } from "next/navigation";

// The old category pages were sample content, not real forums. The real forums are the communities on the hub.
export default function RetiredCategoryPage() {
  redirect("/forum");
}
