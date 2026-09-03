/**
 * Business unit → colour.
 *
 * A job board with 38 departments and hundreds of roles is a wall of text. Giving each
 * business unit a hue lets the eye group the list — an engineering role and a mine role
 * are visibly different before either title is read.
 *
 * The colours are tokens (see globals.css), not literals, so the palette stays in one
 * place. Anything unrecognised falls back to neutral rather than being assigned a colour
 * that means nothing.
 */
export const UNIT_BY_DEPARTMENT: Record<string, string> = {
  dept_eng_it: 'technology', dept_prod: 'technology', dept_design: 'technology',
  dept_data: 'technology', dept_qa: 'technology', dept_devops: 'technology',
  dept_security: 'technology', dept_it_support: 'technology', dept_rd: 'technology',
  dept_ai: 'technology',

  dept_media: 'media', dept_social: 'media',

  dept_sales: 'growth', dept_sales_eng: 'growth', dept_mktg: 'growth',
  dept_partnerships: 'growth',

  dept_support: 'customer', dept_impl: 'customer', dept_trust: 'customer',
  dept_loc: 'customer',

  dept_ops: 'operations', dept_supply: 'operations', dept_procurement: 'operations',
  dept_facilities: 'operations', dept_admin: 'operations',

  dept_mine_ops: 'mining', dept_mine_geo: 'mining', dept_mine_maint: 'mining',
  dept_mine_proc: 'mining', dept_mine_hse: 'mining', dept_mine_admin: 'mining',

  dept_finance: 'corporate', dept_legal: 'corporate', dept_strategy: 'corporate',
  dept_exec: 'corporate',

  dept_hr: 'people', dept_ta: 'people', dept_l_and_d: 'people',
};

/**
 * The colour rule beside a role. Uses the full-brightness `-bar` token — these are the
 * reference site's own accents, and they are meant to be bright as a block.
 */
export function unitBarClass(departmentId?: string | null): string {
  const unit = departmentId ? UNIT_BY_DEPARTMENT[departmentId] : undefined;
  switch (unit) {
    case 'technology': return 'bg-unit-technology-bar';
    case 'mining':     return 'bg-unit-mining-bar';
    case 'media':      return 'bg-unit-media-bar';
    case 'growth':     return 'bg-unit-growth-bar';
    case 'customer':   return 'bg-unit-customer-bar';
    case 'operations': return 'bg-unit-operations-bar';
    case 'corporate':  return 'bg-unit-corporate-bar';
    case 'people':     return 'bg-unit-people-bar';
    default:           return 'bg-border';
  }
}

export function unitTextClass(departmentId?: string | null): string {
  const unit = departmentId ? UNIT_BY_DEPARTMENT[departmentId] : undefined;
  switch (unit) {
    case 'technology': return 'text-unit-technology';
    case 'mining':     return 'text-unit-mining';
    case 'media':      return 'text-unit-media';
    case 'growth':     return 'text-unit-growth';
    case 'customer':   return 'text-unit-customer';
    case 'operations': return 'text-unit-operations';
    case 'corporate':  return 'text-unit-corporate';
    case 'people':     return 'text-unit-people';
    default:           return 'text-muted-foreground';
  }
}
