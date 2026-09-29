'use client';

import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { consignmentApi } from '@/lib/api-client';
import type { CertificateVerification } from '@/lib/types';

/**
 * Public "Verify a Certificate of Authenticity" widget. Anyone can enter a certificate
 * code printed on an Amarisé certificate and confirm the piece against the registry
 * (consignmentApi.verifyCertificate — a PUBLIC endpoint).
 *
 * `initialCode` lets the product detail page deep-link a piece's certificate
 * (?code=…) straight into a verified result.
 */
export function CertificateVerifier({ initialCode }: { initialCode?: string }) {
  const [code, setCode] = useState(initialCode ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CertificateVerification | null>(null);

  const verify = async (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      setError('Enter the certificate code printed on your certificate.');
      return;
    }
    setError(null);
    setResult(null);
    setLoading(true);
    const res = await consignmentApi.verifyCertificate(trimmed);
    setLoading(false);
    if (res.ok) {
      setResult(res.data);
    } else {
      setError(res.error.message || 'We could not verify that code. Please try again.');
    }
  };

  // Auto-verify when a code was deep-linked in.
  useEffect(() => {
    if (initialCode && initialCode.trim()) {
      void verify(initialCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once for the deep-linked code
  }, [initialCode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void verify(code);
  };

  const isValid = result?.valid === true;
  const isInvalid = result != null && result.valid === false;

  return (
    <div className="bg-white border border-border p-8 md:p-10 space-y-6">
      <div className="space-y-2">
        <span className="text-plum text-[10px] font-bold tracking-[0.4em] uppercase">
          Registry Lookup
        </span>
        <h2 className="text-2xl font-headline font-bold italic tracking-tight text-gray-900">
          Verify a Certificate of Authenticity
        </h2>
        <p className="text-sm text-gray-500 font-light italic leading-relaxed">
          Enter the unique code from your numbered certificate to confirm it against our registry.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Certificate code, e.g. AMS-2026-00123"
          aria-label="Certificate code"
          className="h-12 rounded-none border-gray-300 bg-white text-sm font-mono tracking-wider focus:ring-0 focus:border-black"
        />
        <Button
          type="submit"
          disabled={loading}
          className="h-12 px-8 rounded-none bg-black text-white hover:bg-plum text-[10px] font-bold tracking-[0.2em] uppercase shrink-0"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying…
            </>
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" /> Verify
            </>
          )}
        </Button>
      </form>

      {error && (
        <p role="alert" className="text-[12px] text-red-600 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" /> {error}
        </p>
      )}

      {isValid && result?.certificate && (
        <div className="border border-emerald-200 bg-emerald-50/60 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
            <p className="text-sm font-bold uppercase tracking-widest text-emerald-700">
              Authentic — Verified in Registry
            </p>
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
            <CertField label="Brand" value={result.certificate.brand} />
            <CertField label="Model" value={result.certificate.model} />
            <CertField
              label="Condition"
              value={
                result.certificate.conditionGrade
                  ? String(result.certificate.conditionGrade).replace(/_/g, ' ')
                  : undefined
              }
            />
            <CertField label="Serial Number" value={result.certificate.serialNumber} />
            <CertField
              label="Issued"
              value={
                result.certificate.issuedAt
                  ? new Date(result.certificate.issuedAt).toLocaleDateString()
                  : undefined
              }
            />
            <CertField label="Status" value={result.certificate.status} />
          </dl>
        </div>
      )}

      {isInvalid && (
        <div className="border border-red-200 bg-red-50/60 p-6 flex items-start gap-3">
          <ShieldAlert className="w-6 h-6 text-red-500 shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-bold uppercase tracking-widest text-red-600">
              Not Found in Registry
            </p>
            <p className="text-[12px] text-red-500/90 font-light italic">
              This code does not match a certificate we have issued. If you believe this is an
              error, please contact a specialist.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function CertField({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="space-y-0.5">
      <dt className="text-[9px] font-bold uppercase tracking-[0.3em] text-gray-400">{label}</dt>
      <dd className="text-sm font-medium text-gray-900 capitalize">{value}</dd>
    </div>
  );
}

export default CertificateVerifier;
