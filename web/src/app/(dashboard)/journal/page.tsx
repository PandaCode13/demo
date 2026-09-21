import type { Metadata } from "next";
import JournalView from "@/components/JournalView";

export const metadata: Metadata = { title: "Journal" };

export default function JournalPage() {
  return <JournalView />;
}