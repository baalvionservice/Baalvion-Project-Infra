import type { Metadata } from "next";
import Link from "next/link";
import { getStorefrontDepartments, getStorefrontCategories } from "@/lib/api/commerce";

export const metadata: Metadata = {
  title: "Shop | Market Underworld",
  description: "Browse verified sellers and real inventory on Market Underworld.",
  alternates: { canonical: "/shop" },
};

export default async function ShopIndexPage() {
  const [departments, categories] = await Promise.all([getStorefrontDepartments(), getStorefrontCategories()]);

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-[#e5e7eb] px-6 py-12 max-w-6xl mx-auto space-y-12">
      <h1 className="text-4xl font-bold tracking-tight text-white">Shop</h1>

      {departments.length === 0 ? (
        <p className="text-gray-500">No departments published yet.</p>
      ) : (
        departments.map((dept) => {
          const deptCategories = categories.filter((c) => c.departmentId === dept.id);
          return (
            <section key={dept.id} className="space-y-4">
              <h2 className="text-xl font-bold text-white">{dept.name}</h2>
              {dept.description && <p className="text-sm text-gray-500">{dept.description}</p>}
              <div className="flex flex-wrap gap-3">
                {(deptCategories.length > 0 ? deptCategories : dept.categories.map((slug) => ({ id: slug, name: slug }))).map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/shop/${cat.id}`}
                    className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-sm font-bold text-gray-300 hover:text-white hover:border-white/20 transition-all"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
