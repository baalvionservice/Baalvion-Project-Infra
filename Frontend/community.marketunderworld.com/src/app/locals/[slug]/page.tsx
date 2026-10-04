import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getListing, getListings } from "@/lib/api/nightlife";
import { ListingDetailClient } from "./listing-detail-client";

interface Props {
  params: Promise<{ slug: string }>;
}

// Generate static paths for all listings at build time (SSG)
export async function generateStaticParams() {
  return (await getListings()).map((listing) => ({ slug: listing.slug }));
}

// Generate unique SEO metadata per listing
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getListing(slug);
  // Throwing here (not just in the page) makes crawlers get a real 404: Next blocks the shell on metadata for bots.
  if (!listing) notFound();

  const ageRange = listing.minAge
    ? ` · Age ${listing.minAge}${listing.maxAge ? `–${listing.maxAge}` : "+"}`
    : "";
  const genderNote = listing.gender && listing.gender !== "Any" ? ` · ${listing.gender} Only` : "";

  const title = `${listing.title} — ${listing.city}${ageRange}${genderNote} | Market Underworld Locals`;
  const description = `${listing.description.slice(0, 155).trim()}... Apply now on Market Underworld Locals Hub.`;

  return {
    title,
    description,
    keywords: [
      ...(listing.seoKeywords || []),
      `${listing.type} ${listing.city}`,
      `${listing.city} casting call 2026`,
      `${listing.city} ${listing.type.toLowerCase()}`,
    ],
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://community.marketunderworld.com/locals/${listing.slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: `/locals/${listing.slug}`,
    },
  };
}

export default async function ListingDetailPage({ params }: Props) {
  const { slug } = await params;
  const listing = await getListing(slug);
  if (!listing) notFound();

  // JSON-LD structured data for Google Jobs / Events
  const isJob = listing.type === "Casting & Jobs";
  const jsonLd = isJob
    ? {
        "@context": "https://schema.org",
        "@type": "JobPosting",
        title: listing.title,
        description: listing.description,
        hiringOrganization: {
          "@type": "Organization",
          name: listing.postedBy,
        },
        jobLocation: {
          "@type": "Place",
          address: {
            "@type": "PostalAddress",
            addressLocality: listing.city,
            addressCountry: "IN",
          },
        },
        employmentType: "TEMPORARY",
        ...(listing.salary ? { baseSalary: { "@type": "MonetaryAmount", currency: "INR", value: listing.salary } } : {}),
        ...(listing.minAge ? { applicantLocationRequirements: { "@type": "Country", name: "India" } } : {}),
        datePosted: new Date().toISOString().split("T")[0],
        validThrough: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      }
    : {
        "@context": "https://schema.org",
        "@type": "Event",
        name: listing.title,
        description: listing.description,
        location: {
          "@type": "Place",
          name: listing.location,
          address: {
            "@type": "PostalAddress",
            addressLocality: listing.city,
            addressCountry: "IN",
          },
        },
        organizer: {
          "@type": "Organization",
          name: listing.postedBy,
        },
        ...(listing.date ? { startDate: listing.date } : {}),
      };

  return (
    <>
      {/* Inject JSON-LD into <head> */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ListingDetailClient listing={listing} />
    </>
  );
}
