import relations from '@/data/relations.json';
import { EntityRelation, ID } from '@/types/entity';

/**
 * @fileOverview Utilities for traversing the Knowledge Graph relationship matrix.
 * Designed for future migration to graph databases (Neo4j, GraphQL, or ElasticSearch graph).
 */

export function getRelationsForEntity(entityId: ID): EntityRelation[] {
  return (relations as EntityRelation[]).filter(
    r => r.source_id === entityId || r.target_id === entityId
  );
}

export function getRelatedEntityIds(entityId: ID): ID[] {
  const entityRelations = getRelationsForEntity(entityId);
  return entityRelations.map(r => 
    r.source_id === entityId ? r.target_id : r.source_id
  );
}
