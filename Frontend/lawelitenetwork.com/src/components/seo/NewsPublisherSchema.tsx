import React from 'react';

export function NewsPublisherSchema() {
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'NewsMediaOrganization',
    name: 'Law Elite Network',
    url: 'https://www.lawelitenetwork.com',
    logo: {
      '@type': 'ImageObject',
      url: 'https://www.lawelitenetwork.com/logo.png',
      width: 600,
      height: 60,
    },
    publishingPrinciples: 'https://www.lawelitenetwork.com/editorial-process',
    correctionsPolicy: 'https://www.lawelitenetwork.com/corrections',
    ethicsPolicy: 'https://www.lawelitenetwork.com/sponsored-content-policy',
    diversityPolicy: 'https://www.lawelitenetwork.com/diversity-policy',
    knowsAbout: [
      'Legal History',
      'Law and Popular Culture',
      'Legal Language',
      'Law and Technology',
      'Law and Society',
      'Law School Education',
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
