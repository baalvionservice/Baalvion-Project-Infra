import React from 'react';

interface Props {
  html: string;
}

export default function ArticleBody({ html }: Props) {
  return (
    <div
      className="prose lg:prose-xl max-w-none"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
