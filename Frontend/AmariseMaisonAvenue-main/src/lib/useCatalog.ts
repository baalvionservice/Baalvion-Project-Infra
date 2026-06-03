'use client';
/**
 * Client-side hooks over the catalog data layer (./catalog), for Client Components that
 * previously imported the mock arrays. Each hook fetches the live storefront API once and
 * exposes { data, loading }. Server Components should call ./catalog functions directly.
 */
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  getProducts, getProductById, getDepartments, getCategories, getCollections,
  type ProductsPage, type ProductQuery,
} from './catalog';
import type { Product, Department, Category, Collection, CountryCode } from './types';
import { normalizeCountry } from './i18n/countries';

const EMPTY_PAGE: ProductsPage = { items: [], total: 0, page: 1, pageSize: 20, totalPages: 1 };

/** Resolve the active market from the URL so every catalog call is country-scoped by default. */
function useActiveCountry(explicit?: CountryCode): CountryCode {
  const params = useParams();
  return explicit ?? normalizeCountry(params?.country);
}

export function useProducts(query: ProductQuery = {}) {
  const country = useActiveCountry(query.country);
  const scoped: ProductQuery = { ...query, country };
  const [page, setPage] = useState<ProductsPage>(EMPTY_PAGE);
  const [loading, setLoading] = useState(true);
  const key = JSON.stringify(scoped);
  useEffect(() => {
    let active = true;
    setLoading(true);
    getProducts(scoped).then((d) => { if (active) { setPage(d); setLoading(false); } });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return { products: page.items, total: page.total, loading };
}

export function useProduct(idOrSlug?: string, country?: CountryCode) {
  const activeCountry = useActiveCountry(country);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    if (!idOrSlug) { setLoading(false); return; }
    setLoading(true);
    getProductById(idOrSlug, activeCountry).then((p) => { if (active) { setProduct(p); setLoading(false); } });
    return () => { active = false; };
  }, [idOrSlug, activeCountry]);
  return { product, loading };
}

function useList<T>(fetcher: (country: CountryCode) => Promise<T[]>, country: CountryCode) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    setLoading(true);
    fetcher(country).then((d) => { if (active) { setData(d); setLoading(false); } });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country]);
  return { data, loading };
}

export function useDepartments(country?: CountryCode) {
  const { data, loading } = useList<Department>(getDepartments, useActiveCountry(country));
  return { departments: data, loading };
}
export function useCategories(country?: CountryCode) {
  const { data, loading } = useList<Category>(getCategories, useActiveCountry(country));
  return { categories: data, loading };
}
export function useCollections(country?: CountryCode) {
  const { data, loading } = useList<Collection>(getCollections, useActiveCountry(country));
  return { collections: data, loading };
}
