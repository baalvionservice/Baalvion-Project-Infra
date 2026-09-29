import type { Metadata } from 'next';
import { phase2Documents } from "@/lib/phase2-data";
import DataRoomClient from "./DataRoomClient";

export const metadata: Metadata = {
  title: 'Phase 2: SPV Data Room | Baalvion',
  description: 'Access confidential documents for the Project Olympus SPV.',
};

export default function Phase2DataRoomPage() {
  return <DataRoomClient initialDocuments={phase2Documents} />;
}