import React from 'react';

export function NewsPublisherSchema() {
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'NewsMediaOrganization',
    name: 'Law Elite Network',
    url: 'https://lawelitenetwork.com',
    logo: {
      '@type': 'ImageObject',
      url: 'https://lawelitenetwork.com/logo.png',
      width: 600,
      height: 60,
    },
    publishingPrinciples: 'https://lawelitenetwork.com/editorial-policy',
    correctionsPolicy: 'https://lawelitenetwork.com/policies',
    ethicsPolicy: 'https://lawelitenetwork.com/sponsored-content-policy',
    diversityPolicy: 'https://lawelitenetwork.com/about-us',
    knowsAbout: [
      'Legal News',
      'Supreme Court Dockets',
      'Celebrity Legal Disputes',
      'Corporate Governance Litigation',
      'Public Figure Biographies',
    ],
    sameAs: [
      'https://twitter.com/LawEliteNet',
      'https://facebook.com/LawEliteNetwork',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
    />
  );
}
