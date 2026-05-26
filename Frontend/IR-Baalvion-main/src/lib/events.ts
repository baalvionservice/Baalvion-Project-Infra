export type MockEvent = {
  id: string;
  user: string;
  action: string;
  timestamp: string;
  phase: 'P1' | 'P2' | 'P3' | 'Admin' | 'System';
};

// Initial state with some events
export let mockEventLog: MockEvent[] = [
  { id: "LOG006", user: "Elena Petrov (P3)", action: "Achieved KPI 'Reduce Supply Chain Cost by 5%'", timestamp: "2024-07-31 09:30:00", phase: 'P3' },
  { id: "LOG005", user: "Admin", action: "Issued Phase 3 Grant to 'Elena Petrov'", timestamp: "2024-07-30 15:00:00", phase: 'Admin' },
  { id: "LOG004", user: "Admin", action: "Initiated Capital Call for 'Project Olympus'", timestamp: "2024-07-29 11:05:00", phase: 'Admin' },
  { id: "LOG003", user: "Acme Capital (P2)", action: "Acknowledged 'SPV Operating Agreement'", timestamp: "2024-07-29 14:22:01", phase: 'P2' },
  { id: "LOG002", user: "Admin", action: "Approved P1 investor 'John Doe'", timestamp: "2024-07-28 09:12:05", phase: 'Admin' },
  { id: "LOG001", user: "Jane Smith (P1)", action: "Downloaded 'Q2 Financials.pdf'", timestamp: "2024-07-28 10:45:12", phase: 'P1' },
];

// In-memory event bus (for demo purposes)
type Listener = (event: MockEvent) => void;
const listeners: Listener[] = [];

export const addEventListener = (listener: Listener) => {
  listeners.push(listener);
};

export const removeEventListener = (listener: Listener) => {
  const index = listeners.indexOf(listener);
  if (index > -1) {
    listeners.splice(index, 1);
  }
};

export const addMockEvent = (event: Omit<MockEvent, 'id' | 'timestamp'>) => {
  const newEvent: MockEvent = {
    ...event,
    id: `LOG${(Math.random() * 10000).toFixed(0).padStart(3, '0')}`,
    timestamp: new Date().toLocaleString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(',', ''),
  };
  mockEventLog.unshift(newEvent);
  
  // Notify listeners
  listeners.forEach(l => l(newEvent));

  return newEvent;
};
