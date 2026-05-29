/**
 * Shared adapters: map law-service (Postgres, snake_case) responses onto the shapes
 * the Law-Elite UI/components expect. One place to keep field mapping consistent.
 * No Firebase, no mocks.
 */

export const unwrapList = (res: any): any[] => {
  const d = res?.data?.data;
  if (Array.isArray(d)) return d;
  return d?.items || [];
};
export const unwrapOne = (res: any): any => res?.data?.data ?? null;

export const adaptCase = (c: any) => {
  if (!c) return null;
  return {
    id: String(c.id),
    caseId: String(c.id),
    title: c.title,
    description: c.description,
    category: c.category,
    status: c.status,                 // open | in_progress | closed | archived
    priority: c.priority,
    outcome: c.outcome ?? null,
    clientId: c.client_id != null ? String(c.client_id) : undefined,
    lawyerId: c.lawyer_id != null ? String(c.lawyer_id) : undefined,
    clientName: c.client?.name,
    lawyerName: c.lawyer?.name,
    createdAt: c.created_at || c.createdAt,
    updatedAt: c.updated_at || c.updatedAt,
    closedAt: c.closed_at ?? null,
  };
};

export const adaptAppointment = (b: any) => {
  if (!b) return null;
  const dt = b.scheduled_at ? new Date(b.scheduled_at) : null;
  return {
    id: String(b.id),
    appointmentId: String(b.id),
    clientId: b.client_id != null ? String(b.client_id) : undefined,
    lawyerId: b.lawyer_id != null ? String(b.lawyer_id) : undefined,
    lawyerName: b.lawyer?.name,
    clientName: b.client?.name,
    caseId: b.case_id != null ? String(b.case_id) : undefined,
    type: b.type,
    status: b.status,                 // pending | confirmed | completed | cancelled
    notes: b.notes,
    amount: Number(b.total_amount || 0),
    date: dt ? dt.toISOString().slice(0, 10) : undefined,
    time: dt ? dt.toISOString().slice(11, 16) : undefined,
    scheduledAt: b.scheduled_at,
    duration: b.duration,
    createdAt: b.created_at || b.createdAt,
  };
};

export const adaptNotification = (n: any) => ({
  id: String(n.id),
  notificationId: String(n.id),
  userId: n.user_id,
  title: n.title,
  message: n.message,
  type: n.type,
  isRead: !!n.read,
  read: !!n.read,
  priority: n.data?.priority || 'medium',
  relatedCaseId: n.data?.relatedCaseId,
  createdAt: n.created_at || n.createdAt,
});

export const adaptDocument = (d: any) => ({
  id: String(d.id),
  documentId: String(d.id),
  caseId: d.case_id != null ? String(d.case_id) : undefined,
  name: d.name,
  fileName: d.name,
  type: d.type,
  url: d.url,
  fileUrl: d.url,
  size: d.size,
  category: d.category,
  ownerId: d.owner_id,
  createdAt: d.created_at || d.createdAt,
});

export const adaptProfile = (u: any) => {
  if (!u) return null;
  return {
    uid: String(u.id),
    userId: String(u.id),
    id: String(u.id),
    name: u.full_name || u.name || (u.email ? u.email.split('@')[0] : ''),
    fullName: u.full_name,
    email: u.email,
    role: u.role,
    roleId: u.role,
    isActive: u.is_active,
    createdAt: u.created_at || u.createdAt,
  };
};
