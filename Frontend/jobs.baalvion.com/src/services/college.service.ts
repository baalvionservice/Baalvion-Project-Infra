
import { adapter } from './adapter';
import { College } from '@/types/campus';
import { PaginatedResponse, TableQuery } from '@/components/system/DataTable';

interface CollegeWithType extends College {
  id: string;
  type: "1" | "2" | "3";
}

// Live: pulls every college from jobs-service (/campus/colleges) via the adapter.
// `type` is a UI grouping bucket — derived from the college's real tier/category when the
// backend provides one, otherwise defaulted to "1" (no fabricated per-index data).
const getAllColleges = async (): Promise<CollegeWithType[]> => {
  const rows = (await adapter.getAllColleges()) as unknown as (College & Record<string, unknown>)[];
  const list = Array.isArray(rows) ? rows : ((rows as any)?.data ?? []);
  return list.map((c: College & Record<string, unknown>) => {
    const tier = String(c.type ?? c.tier ?? c.category ?? '1');
    const type = (['1', '2', '3'].includes(tier) ? tier : '1') as "1" | "2" | "3";
    return { ...c, id: String((c as any).id ?? c.collegeId), type };
  });
};

export const collegeService = {
    getColleges: (query: TableQuery): Promise<PaginatedResponse<College & { id: string }>> => adapter.getColleges(query),
    getAllColleges,
    createCollege: (data: Omit<College, 'collegeId'>): Promise<College> => adapter.createCollege(data),
    updateCollege: (data: College): Promise<College> => adapter.updateCollege(data),
    deleteCollege: (collegeId: string): Promise<{ success: boolean }> => adapter.deleteCollege(collegeId),
};
