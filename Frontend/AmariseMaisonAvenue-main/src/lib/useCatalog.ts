'use client';
/**
 * Client-side hooks over the catalog data layer (./catalog), for Client Components that
 * previously imported the mock arrays. Each hook fetches the live storefront API once and
 * exposes { data, loading }. Server Components should call ./catalog functions directly.
 */
import { useEffect, useState } from 'react';
import {
  getProducts, getDepartments, getCategories, getCollections,
  type ProductsPage, type ProductQuery,
} from './catalog';
import type { Product, Department, Category, Collection } from './types';

const EMPTY_PAGE: ProductsPage = { items: [], total: 0, page: 1, pageSize: 20, totalPages: 1 };

export function useProducts(query: ProductQuery = {}) {
  const [page, setPage] = useState<ProductsPage>(EMPTY_PAGE);
  const [loading, setLoading] = useState(true);
  const key = JSON.stringify(query);
  useEffect(() => {
    let active = true;
    setLoading(true);
    getProducts(query).then((d) => { if (active) { setPage(d); setLoading(false); } });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return { products: page.items, total: page.total, loading };
}

function useList<T>(fetcher: () => Promise<T[]>) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    setLoading(true);
    fetcher().then((d) => { if (active) { setData(d); setLoading(false); } });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return { data, loading };
}

export function useDepartments() {
  const { data, loading } = useList<Department>(getDepartments);
  return { departments: data, loading };
}
export function useCategories() {
  const { data, loading } = useList<Category>(getCategories);
  return { categories: data, loading };
}
export function useCollections() {
  const { data, loading } = useList<Collection>(getCollections);
  return { collections: data, loading };
}
