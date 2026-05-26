'use client';

import { RegulatoryPacket } from "../content/schemas";
import { authService } from "./auth.service";
import { auditService } from "./audit.service";

let packetsState: RegulatoryPacket[] = [];

export const packetBuilderService = {
  getPackets: async (): Promise<RegulatoryPacket[]> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return [...packetsState];
  },

  createPacket: async (title: string, reportIds: string[], documentIds: string[]): Promise<void> => {
    const { role } = await authService.getCurrentUser();
    await new Promise(resolve => setTimeout(resolve, 300));

    const newPacket: RegulatoryPacket = {
      id: `pack-${Math.random().toString(36).substr(2, 9)}`,
      title,
      includedReports: reportIds,
      includedDocuments: documentIds,
      createdAt: new Date().toISOString(),
      createdByRole: role,
      status: 'Draft'
    };

    packetsState.push(newPacket);
    await auditService.log({
      userRole: role,
      module: 'Reporting',
      action: 'create',
      entityId: newPacket.id,
      newState: newPacket
    });

    window.dispatchEvent(new Event('packets-updated'));
  }
};
