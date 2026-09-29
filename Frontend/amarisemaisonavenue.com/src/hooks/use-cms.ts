'use client';

import { useAppStore } from '@/lib/store';
import { CMSSection, Product, Collection, Editorial } from '@/lib/types';

export function useCMS() {
  const { 
    cmsSections, 
    products, 
    collections, 
    editorials,
    upsertCMSSection,
    upsertProduct,
    deleteProduct,
    upsertCollection,
    upsertEditorial
  } = useAppStore();

  const getSection = (id: string) => cmsSections.find(s => s.id === id);
  const isSectionVisible = (id: string) => getSection(id)?.visible ?? false;

  return {
    sections: cmsSections,
    products,
    collections,
    editorials,
    getSection,
    isSectionVisible,
    updateSection: upsertCMSSection,
    updateProduct: upsertProduct,
    removeProduct: deleteProduct,
    updateCollection: upsertCollection,
    updateEditorial: upsertEditorial
  };
}
