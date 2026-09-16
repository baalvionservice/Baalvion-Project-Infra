/**
 * @file src/services/booking-followup-service.ts
 * @description What has to happen after a carrier accepts a booking: the equipment
 * gets records of its own, and a customs declaration is opened for the lane.
 *
 * The freight gateway already materialises a `tradeops.shipments` row from the
 * booking, and that shipment id is what the rest of the platform — containers,
 * customs, tracking, insurance — hangs off. This module does the two follow-on
 * writes the booking flow owes that shipment.
 *
 * NOTHING HERE MAY FAIL THE BOOKING. The container is booked with the carrier
 * whatever happens locally; each step reports its own outcome so the UI can say
 * exactly what exists and what still needs doing, rather than implying a clean
 * result or a failed booking.
 */
import { apiClient } from '@/lib/api-client';

/** trade-service's container_type vocabulary, keyed by our ISO equipment code. */
const CONTAINER_TYPE: Record<string, string> = {
  '20GP': '20ft',
  '40GP': '40ft',
  '40HC': '40hc',
  '45HC': '45hc',
  '20RF': 'reefer',
  '40RH': 'reefer',
  '20OT': 'open_top',
  '40FR': 'flat_rack',
};

export interface ContainerLineInput {
  containerCode: string;
  isoCode?: string;
  quantity: number;
  cargoWeightKgPerUnit: number;
  maxPayloadKg?: number;
}

export interface CustomsDraftInput {
  originCountry: string;
  destinationCountry: string;
  incoterm: string;
  currency: string;
  declaredValue: number;
  hsCode?: string;
  commodity?: string;
  containers: number;
}

export interface StepOutcome {
  ok: boolean;
  detail: string;
}

export interface BookingFollowUp {
  shipmentId: string | null;
  containers: StepOutcome & { created: number };
  customs: StepOutcome & { entryId: string | null };
}

/**
 * One record per physical box. The carrier assigns real ISO 6346 numbers at release,
 * so each record carries an explicit `TBA-` reference until then — a plausible-looking
 * fake container number would be indistinguishable from a released one.
 */
async function createContainers(shipmentId: string, reference: string, lines: ContainerLineInput[], carrierId: string | null) {
  let created = 0;
  const failures: string[] = [];
  let sequence = 0;

  for (const line of lines) {
    for (let unit = 0; unit < line.quantity; unit += 1) {
      sequence += 1;
      try {
        await apiClient.post('/containers', {
          shipmentId,
          containerNumber: `TBA-${reference}-${String(sequence).padStart(3, '0')}`,
          isoCode: line.isoCode,
          containerType: CONTAINER_TYPE[line.containerCode] ?? 'fcl',
          carrierId: carrierId ?? undefined,
          // Equipment is booked, not yet stuffed: 'empty' is the truthful state until
          // the box is packed and the seal goes on.
          status: 'empty',
          capacityKg: line.maxPayloadKg,
          weightKg: line.cargoWeightKgPerUnit,
          metadata: { equipment: line.containerCode, source: 'booking_wizard' },
        });
        created += 1;
      } catch (err) {
        failures.push(err instanceof Error ? err.message : 'unknown error');
      }
    }
  }

  if (failures.length === 0) {
    return { ok: true, created, detail: `${created} container record${created === 1 ? '' : 's'} created.` };
  }
  return {
    ok: false,
    created,
    detail: `${created} of ${created + failures.length} container records created. ${[...new Set(failures)].join('; ')}`,
  };
}

/**
 * Open the import declaration for the lane. trade-service classifies and prices the
 * lines itself against the knowledge base, so this sends the facts and lets the duty
 * calculator do the arithmetic rather than sending a number the client made up.
 */
async function createCustomsDraft(shipmentId: string, draft: CustomsDraftInput) {
  try {
    const res = await apiClient.post<{ id?: string }>('/customs_entries', {
      shipmentId,
      originCountry: draft.originCountry,
      destinationCountry: draft.destinationCountry,
      entryType: 'import',
      incoterm: draft.incoterm,
      currency: draft.currency,
      customsValue: draft.declaredValue,
      status: 'draft',
      lineItems: [
        {
          description: draft.commodity || 'Containerised cargo',
          hsCode: draft.hsCode || undefined,
          quantity: draft.containers,
          value: draft.declaredValue,
        },
      ],
      metadata: { source: 'booking_wizard' },
    });
    const entryId = (res.data as { id?: string } | null)?.id ?? null;
    return { ok: true, entryId, detail: 'Import declaration opened as a draft, with duty and tax estimated from the knowledge base.' };
  } catch (err) {
    return {
      ok: false,
      entryId: null,
      detail: err instanceof Error ? err.message : 'The declaration could not be opened.',
    };
  }
}

export interface FollowUpInput {
  shipmentId: string | null;
  reference: string;
  carrierId: string | null;
  lines: ContainerLineInput[];
  customs: CustomsDraftInput | null;
}

/** Run both follow-ups, reporting each independently. Never throws. */
export async function bookingFollowUp(input: FollowUpInput): Promise<BookingFollowUp> {
  if (!input.shipmentId) {
    const detail = 'The carrier accepted the booking but no shipment record was created for it, so equipment and customs could not be attached.';
    return {
      shipmentId: null,
      containers: { ok: false, created: 0, detail },
      customs: { ok: false, entryId: null, detail },
    };
  }

  const containers = await createContainers(input.shipmentId, input.reference, input.lines, input.carrierId);
  const customs = input.customs
    ? await createCustomsDraft(input.shipmentId, input.customs)
    : { ok: true, entryId: null, detail: 'No declaration requested.' };

  return { shipmentId: input.shipmentId, containers, customs };
}
