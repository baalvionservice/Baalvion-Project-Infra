import * as mockApi from '@/services/mock-api/users';
import * as roleApi from '@/services/mock-api/roles';
import { User, RoleDefinition, RoleControl, RolePermissionSet, ApiResponse, UserStatus } from '@/types';
import { errorHandler } from '@/lib/errors/error-handler';

/**
 * @fileOverview Abstraction layer for user and role related data fetching with error handling.
 */

export const usersService = {
  async getUsers(): Promise<ApiResponse<User[]>> {
    try {
      return await mockApi.getUsers();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: [],
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async updateUserStatuses(userIds: string[], status: UserStatus): Promise<ApiResponse<User[]>> {
    try {
      return await mockApi.updateUserStatuses(userIds, status);
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: [],
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getRoles(): Promise<ApiResponse<RoleDefinition[]>> {
    try {
      return await roleApi.getRoles();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: [],
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getControlRoles(): Promise<ApiResponse<RoleControl[]>> {
    try {
      return await roleApi.getControlRoles();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: [],
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async getRolePermissions(): Promise<ApiResponse<RolePermissionSet[]>> {
    try {
      return await roleApi.getRolePermissions();
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: [],
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async assignPermissions(roleId: string, permissions: string[]): Promise<ApiResponse<RoleControl>> {
    try {
      return await roleApi.assignPermissions(roleId, permissions);
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: null as any,
        status: appError.statusCode,
        error: appError.message,
      };
    }
  },

  async createOrUpdateRole(role: Partial<RoleControl>): Promise<ApiResponse<RoleControl[]>> {
    try {
      return await roleApi.createOrUpdateRole(role);
    } catch (error) {
      const appError = errorHandler.handleError(error);
      return {
        data: [],
        status: appError.statusCode,
        error: appError.message,
      };
    }
  }
};
