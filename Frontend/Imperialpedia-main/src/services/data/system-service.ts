import * as mockApi from '@/services/mock-api/system';
import * as transparencyMock from '@/services/mock-api/transparency';
import { ApiResponse } from '@/types';
import { SystemSettings, SystemNotification, AdminAlert, SystemHealth, Backup, AccessLog, ErrorLog, FeatureFlag, NotificationLog, PlatformSettings, AdminActivityLog, SecuritySettings, GlobalNotificationSettings, AuditTrailEntry, FeatureSettings, AdminSession, BrandingSettings, SystemAlert, AdminHomeOverview, SecurityDashboardData, AdminSystemHubData, SecurityMockData, InfrastructureMockData, EdgeComputingData, CdnManagementData, SeoManagementData, ExperimentManagementData, IncidentResponseData, AccessManagementData, LocalizationData, AlertsSystemData, TransparencyData } from '@/types/system';
import { errorHandler } from '@/lib/errors/error-handler';

/**
 * @fileOverview Abstraction layer for platform configuration and system messaging.
 */

export const systemService = {
  async getPlatformSettings(): Promise<ApiResponse<PlatformSettings | null>> {
    try {
      return await mockApi.getPlatformSettings();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: null,
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async updatePlatformSettings(settings: PlatformSettings): Promise<ApiResponse<PlatformSettings | null>> {
    try {
      return await mockApi.updatePlatformSettings(settings);
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: null,
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getBrandingSettings(): Promise<ApiResponse<BrandingSettings | null>> {
    try {
      return await mockApi.getBrandingSettings();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: null,
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async updateBrandingSettings(settings: BrandingSettings): Promise<ApiResponse<BrandingSettings | null>> {
    try {
      return await mockApi.updateBrandingSettings(settings);
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: null,
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getFeatureSettings(): Promise<ApiResponse<FeatureSettings | null>> {
    try {
      return await mockApi.getFeatureSettings();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: null,
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async updateFeatureSettings(settings: FeatureSettings): Promise<ApiResponse<FeatureSettings | null>> {
    try {
      return await mockApi.updateFeatureSettings(settings);
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: null,
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getSettings(): Promise<ApiResponse<SystemSettings | null>> {
    try {
      return await mockApi.getSystemSettings();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: null,
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async updateSettings(settings: SystemSettings): Promise<ApiResponse<SystemSettings | null>> {
    try {
      return await mockApi.updateSystemSettings(settings);
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: null,
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getGlobalNotificationSettings(): Promise<ApiResponse<GlobalNotificationSettings | null>> {
    try {
      return await mockApi.getGlobalNotificationSettings();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: null,
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async updateGlobalNotificationSettings(settings: GlobalNotificationSettings): Promise<ApiResponse<GlobalNotificationSettings | null>> {
    try {
      return await mockApi.updateGlobalNotificationSettings(settings);
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: null,
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getSecuritySettings(): Promise<ApiResponse<SecuritySettings | null>> {
    try {
      return await mockApi.getSecuritySettings();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: null,
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async updateSecuritySettings(settings: SecuritySettings): Promise<ApiResponse<SecuritySettings | null>> {
    try {
      return await mockApi.updateSecuritySettings(settings);
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: null,
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getSecurityDashboardData(): Promise<ApiResponse<SecurityDashboardData | null>> {
    try {
      return await mockApi.getSecurityDashboardData();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: null,
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getNotifications(): Promise<ApiResponse<SystemNotification[]>> {
    try {
      return await mockApi.getSystemNotifications();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: [],
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async updateNotification(notification: SystemNotification): Promise<ApiResponse<SystemNotification | null>> {
    try {
      return await mockApi.updateSystemNotification(notification);
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: null,
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async deleteNotification(id: string): Promise<ApiResponse<void>> {
    try {
      return await mockApi.deleteSystemNotification(id);
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: undefined,
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getSystemAlerts(): Promise<ApiResponse<SystemAlert[]>> {
    try {
      return await mockApi.getSystemAlerts();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: [],
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getNotificationLogs(): Promise<ApiResponse<NotificationLog[]>> {
    try {
      return await mockApi.getNotificationLogs();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: [],
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getAlerts(): Promise<ApiResponse<AdminAlert[]>> {
    try {
      return await mockApi.getAdminAlerts();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: [],
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getSystemHealth(): Promise<ApiResponse<SystemHealth | null>> {
    try {
      return await mockApi.getSystemHealth();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: null,
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getBackups(): Promise<ApiResponse<Backup[]>> {
    try {
      return await mockApi.getBackups();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: [],
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async createBackup(): Promise<ApiResponse<Backup | null>> {
    try {
      return await mockApi.createBackup();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: null,
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async restoreBackup(id: string): Promise<ApiResponse<void>> {
    try {
      return await mockApi.restoreBackup(id);
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: undefined,
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getFeatureFlags(): Promise<ApiResponse<FeatureFlag[]>> {
    try {
      return await mockApi.getFeatureFlags();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: [],
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async updateFeatureFlag(id: string, enabled: boolean): Promise<ApiResponse<void>> {
    try {
      return await mockApi.updateFeatureFlag(id, enabled);
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: undefined,
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getAccessLogs(): Promise<ApiResponse<AccessLog[]>> {
    try {
      return await mockApi.getAccessLogs();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: [],
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getErrorLogs(): Promise<ApiResponse<ErrorLog[]>> {
    try {
      return await mockApi.getErrorLogs();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: [],
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getAdminLogs(): Promise<ApiResponse<AdminActivityLog[]>> {
    try {
      return await mockApi.getAdminLogs();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: [],
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getAuditTrail(): Promise<ApiResponse<AuditTrailEntry[]>> {
    try {
      return await mockApi.getAuditTrail();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: [],
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getActiveSessions(): Promise<ApiResponse<AdminSession[]>> {
    try {
      return await mockApi.getActiveSessions();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: [],
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async terminateSession(id: string): Promise<ApiResponse<void>> {
    try {
      return await mockApi.terminateSession(id);
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: undefined,
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getAdminHomeOverview(): Promise<ApiResponse<AdminHomeOverview | null>> {
    try {
      return await mockApi.getAdminHomeOverview();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: null,
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getAdminSystemHubData(): Promise<ApiResponse<AdminSystemHubData | null>> {
    try {
      return await mockApi.getAdminSystemHubData();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: null,
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getSecurityMockData(): Promise<ApiResponse<SecurityMockData | null>> {
    try {
      return await mockApi.getSecurityMockData();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: null,
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getInfrastructureMockData(): Promise<ApiResponse<InfrastructureMockData | null>> {
    try {
      return await mockApi.getInfrastructureMockData();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: null,
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getEdgeComputingData(): Promise<ApiResponse<EdgeComputingData | null>> {
    try {
      return await mockApi.getEdgeComputingData();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: null,
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getCdnManagementData(): Promise<ApiResponse<CdnManagementData | null>> {
    try {
      return await mockApi.getCdnManagementData();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: null,
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getSeoManagementData(): Promise<ApiResponse<SeoManagementData | null>> {
    try {
      return await mockApi.getSeoManagementData();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: null,
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getExperimentManagementData(): Promise<ApiResponse<ExperimentManagementData | null>> {
    try {
      return await mockApi.getExperimentManagementData();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: null,
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getIncidentResponseData(): Promise<ApiResponse<IncidentResponseData | null>> {
    try {
      return await mockApi.getIncidentResponseData();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: null,
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getAccessManagementData(): Promise<ApiResponse<AccessManagementData | null>> {
    try {
      return await mockApi.getAccessManagementData();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: null,
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getLocalizationData(): Promise<ApiResponse<LocalizationData | null>> {
    try {
      return await mockApi.getLocalizationData();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: null,
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getAlertsSystemData(): Promise<ApiResponse<AlertsSystemData | null>> {
    try {
      return await mockApi.getAlertsSystemData();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: null,
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getTransparencyData(): Promise<ApiResponse<TransparencyData | null>> {
    try {
      return await transparencyMock.getTransparencyData();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: null,
        status: appError.statusCode,
        error: appError.message,
      };
    }
  }
};
