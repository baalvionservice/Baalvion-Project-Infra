'use strict';

const roles = [
  { value: 'swe_intern',    label: 'Software Engineering Intern',       isoCode: 'IN' },
  { value: 'pm_intern',     label: 'Product Management Intern',         isoCode: 'IN' },
  { value: 'data_intern',   label: 'Data Science Intern',               isoCode: 'IN' },
  { value: 'sde_1_us',      label: 'Software Development Engineer I',   isoCode: 'US' },
  { value: 'marketing_us',  label: 'Product Marketing Manager',         isoCode: 'US' },
  { value: 'backend_pl',    label: 'Backend Engineer (Go)',              isoCode: 'PL' },
  { value: 'devops_pl',     label: 'DevOps Engineer',                   isoCode: 'PL' },
  { value: 'csm_gb',        label: 'Customer Success Manager',          isoCode: 'GB' },
];

const slugToIso = {
  india: 'IN', 'united-states': 'US', poland: 'PL', 'united-kingdom': 'GB',
  canada: 'CA', australia: 'AU', vietnam: 'VN', philippines: 'PH', ukraine: 'UA',
};

function getRolesByCountry(slug) {
  const isoCode = slugToIso[slug];
  if (!isoCode) return [];
  return roles.filter(r => r.isoCode === isoCode);
}

module.exports = { roles, getRolesByCountry };
