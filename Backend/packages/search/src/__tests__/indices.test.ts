import { INDICES, INDEX_MAPPINGS, type IndexName } from '../indices';

describe('INDICES constants', () => {
  it('exports JOBS index name', () => {
    expect(INDICES.JOBS).toBe('baalvion_jobs');
  });

  it('exports ARTICLES index name', () => {
    expect(INDICES.ARTICLES).toBe('baalvion_articles');
  });

  it('exports PRODUCTS index name', () => {
    expect(INDICES.PRODUCTS).toBe('baalvion_products');
  });

  it('exports COMPANIES index name', () => {
    expect(INDICES.COMPANIES).toBe('baalvion_companies');
  });

  it('exports CREATORS index name', () => {
    expect(INDICES.CREATORS).toBe('baalvion_creators');
  });

  it('all index names start with baalvion_', () => {
    for (const name of Object.values(INDICES)) {
      expect(name).toMatch(/^baalvion_/);
    }
  });

  it('has exactly 5 indices', () => {
    expect(Object.keys(INDICES)).toHaveLength(5);
  });
});

describe('INDEX_MAPPINGS structure', () => {
  it('has a mapping for every index in INDICES', () => {
    for (const name of Object.values(INDICES)) {
      expect(INDEX_MAPPINGS[name as IndexName]).toBeDefined();
    }
  });

  describe('JOBS mapping', () => {
    const mapping = INDEX_MAPPINGS[INDICES.JOBS] as { properties: Record<string, any> };

    it('has a properties object', () => {
      expect(mapping.properties).toBeDefined();
      expect(typeof mapping.properties).toBe('object');
    });

    it('title field uses text type with english analyzer', () => {
      expect(mapping.properties.title.type).toBe('text');
      expect(mapping.properties.title.analyzer).toBe('english');
    });

    it('title has a keyword sub-field', () => {
      expect(mapping.properties.title.fields.keyword.type).toBe('keyword');
    });

    it('skills field is keyword type', () => {
      expect(mapping.properties.skills.type).toBe('keyword');
    });

    it('isActive is boolean', () => {
      expect(mapping.properties.isActive.type).toBe('boolean');
    });

    it('postedAt is date', () => {
      expect(mapping.properties.postedAt.type).toBe('date');
    });

    it('salary is a nested object with min/max/currency', () => {
      const salary = mapping.properties.salary.properties;
      expect(salary.min.type).toBe('float');
      expect(salary.max.type).toBe('float');
      expect(salary.currency.type).toBe('keyword');
    });

    it('orgId is keyword', () => {
      expect(mapping.properties.orgId.type).toBe('keyword');
    });
  });

  describe('ARTICLES mapping', () => {
    const mapping = INDEX_MAPPINGS[INDICES.ARTICLES] as { properties: Record<string, any> };

    it('content field uses text with english analyzer', () => {
      expect(mapping.properties.content.type).toBe('text');
      expect(mapping.properties.content.analyzer).toBe('english');
    });

    it('tags field is keyword', () => {
      expect(mapping.properties.tags.type).toBe('keyword');
    });

    it('isPublished is boolean', () => {
      expect(mapping.properties.isPublished.type).toBe('boolean');
    });

    it('publishedAt is date', () => {
      expect(mapping.properties.publishedAt.type).toBe('date');
    });
  });

  describe('PRODUCTS mapping', () => {
    const mapping = INDEX_MAPPINGS[INDICES.PRODUCTS] as { properties: Record<string, any> };

    it('price is float', () => {
      expect(mapping.properties.price.type).toBe('float');
    });

    it('sku is keyword', () => {
      expect(mapping.properties.sku.type).toBe('keyword');
    });

    it('stockLevel is integer', () => {
      expect(mapping.properties.stockLevel.type).toBe('integer');
    });
  });

  describe('COMPANIES mapping', () => {
    const mapping = INDEX_MAPPINGS[INDICES.COMPANIES] as { properties: Record<string, any> };

    it('industry is keyword', () => {
      expect(mapping.properties.industry.type).toBe('keyword');
    });

    it('location is text with keyword sub-field', () => {
      expect(mapping.properties.location.type).toBe('text');
      expect(mapping.properties.location.fields.keyword.type).toBe('keyword');
    });

    it('isVerified is boolean', () => {
      expect(mapping.properties.isVerified.type).toBe('boolean');
    });
  });

  describe('CREATORS mapping', () => {
    const mapping = INDEX_MAPPINGS[INDICES.CREATORS] as { properties: Record<string, any> };

    it('bio is text with english analyzer', () => {
      expect(mapping.properties.bio.type).toBe('text');
      expect(mapping.properties.bio.analyzer).toBe('english');
    });

    it('skills is keyword', () => {
      expect(mapping.properties.skills.type).toBe('keyword');
    });

    it('platforms is keyword', () => {
      expect(mapping.properties.platforms.type).toBe('keyword');
    });

    it('rates has hourly/project/currency sub-fields', () => {
      const rates = mapping.properties.rates.properties;
      expect(rates.hourly.type).toBe('float');
      expect(rates.project.type).toBe('float');
      expect(rates.currency.type).toBe('keyword');
    });

    it('isAvailable is boolean', () => {
      expect(mapping.properties.isAvailable.type).toBe('boolean');
    });
  });
});
