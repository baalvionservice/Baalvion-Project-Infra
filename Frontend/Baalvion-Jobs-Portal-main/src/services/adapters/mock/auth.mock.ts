
import { mockUsers } from './user.mock';

// P0: mock session held in memory only (no sessionStorage/localStorage). Dev-only adapter.
let _mockSession: { userId: string } | null = null;
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const authMockService = {
    async login(email: string, password: string): Promise<{ success: boolean; userId?: string; message?: string; }> {
        await delay(500);
        const user = mockUsers.find(u => u.email === email); // Password check is ignored in mock
        if (user) {
            _mockSession = { userId: user.id };
            return { success: true, userId: user.id };
        }
        return { success: false, message: "Invalid credentials" };
    },

    async logout(): Promise<void> {
        await delay(100);
        _mockSession = null;
    },

    async checkSession(): Promise<{ isAuthenticated: boolean; userId: string | null; }> {
        await delay(300);
        if (_mockSession) {
            return { isAuthenticated: true, userId: _mockSession.userId };
        }
        return { isAuthenticated: false, userId: null };
    }
};
