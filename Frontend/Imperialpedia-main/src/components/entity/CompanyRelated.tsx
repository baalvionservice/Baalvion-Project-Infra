import React from 'react';
import { RelatedEntities } from '@/components/knowledge/RelatedEntities';
import { getRelatedEntities } from '@/lib/data/loaders';
import { CompanyEntity } from '@/types/entity';

interface CompanyRelatedProps {
  company: CompanyEntity;
}

/**
 * Self-fetching wrapper around RelatedEntities — owns the getRelatedEntities() call so
 * it can be dropped behind a Suspense boundary and stream in after the core Overview/Key
 * Facts content has already painted, instead of the whole page waiting on graph traversal.
 */
export const CompanyRelated = async ({ company }: CompanyRelatedProps) => {
  const related = await getRelatedEntities(company as unknown as Parameters<typeof getRelatedEntities>[0]);
  return <RelatedEntities entities={related} />;
};
