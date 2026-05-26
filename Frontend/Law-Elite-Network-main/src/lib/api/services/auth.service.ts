
import { authLawApi, setToken, clearToken } from '@/lib/api/client';
import { UserRepository } from '../repositories/user.repository';
import { ProfileRepository } from '../repositories/profile.repository';
import { UserRole } from '../types';
import { AnalyticsService } from './analytics.service';

export class AuthService {
  constructor(
    private userRepo: UserRepository,
    private profileRepo: ProfileRepository,
    _db?: unknown,
    _auth?: unknown,
    private analytics?: AnalyticsService
  ) {}

  async register(data: { email: string; fullName: string; roleId?: UserRole; password?: string }) {
    if (!data.email || !data.password) throw new Error('Email and password are required.');
    const res = await authLawApi.register(data.email, data.password, data.fullName, data.roleId);
    const { accessToken, userId } = res.data?.data || {};
    if (accessToken) setToken(accessToken);
    if (this.analytics) this.analytics.logEvent('user_signup', { roleId: data.roleId || 'client' }, String(userId));
    return { userId, uid: String(userId) };
  }

  async login(emailInput: string, password?: string) {
    if (!emailInput || !password) throw new Error('Email and password are required.');
    const res = await authLawApi.login(emailInput, password);
    const { accessToken, role, userId } = res.data?.data || {};
    if (accessToken) setToken(accessToken);
    const user = { userId, uid: String(userId), email: emailInput, roleId: role };
    if (this.analytics) this.analytics.logEvent('login', { roleId: role }, String(userId));
    return { user };
  }

  async logout() { clearToken(); }
}
