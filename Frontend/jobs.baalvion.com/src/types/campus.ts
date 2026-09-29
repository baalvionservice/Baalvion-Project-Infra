// Campus / placement domain types. Relocated out of the mock layer (`@/mocks/colleges.mock`)
// so live code does not depend on a mock module. This is a real domain type used by the
// campus admin pages, college service, and the API adapter (distinct from
// `placement.types.College`, which is a different lighter shape).
export interface College {
  collegeId: string;
  name: string;
  city: string;
  state: string;
  accreditation: string;
  isActive: boolean;
}
