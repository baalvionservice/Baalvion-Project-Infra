import { ApiResponse } from '@/types';
import { VersionControlData, ArticleVersion } from '@/types/version-control';

/**
 * @fileOverview Mock service for the Content Version Control system.
 */

const mockVersions: ArticleVersion[] = [
  {
    id: 'v1',
    version: '1.0',
    editor: 'Daniel Harris',
    summary: 'Initial article creation',
    date: '2025-05-12',
    status: 'Archived',
    content: 'The yield curve is a graphical representation of interest rates. It shows the relationship between interest rates and time to maturity. Historically, a normal yield curve is upward sloping.',
    metadata: {
      wordCount: 1200,
      readingTime: 5,
      qualityScore: 75,
      badges: ['Draft Node']
    }
  },
  {
    id: 'v2',
    version: '1.1',
    editor: 'Sarah Collins',
    summary: 'Updated interest rate explanation',
    date: '2025-06-08',
    status: 'Published',
    content: 'The yield curve is a high-fidelity graphical representation of interest rates across various maturities. It shows the relationship between bond yields and time. Historically, a normal yield curve is upward sloping, but an inversion often signals an upcoming recession.',
    metadata: {
      wordCount: 1450,
      readingTime: 6,
      qualityScore: 91,
      badges: ['Expert Reviewed', 'Editor Verified']
    }
  },
  {
    id: 'v3',
    version: '1.2',
    editor: 'Michael Grant',
    summary: 'Added new economic data examples',
    date: '2025-07-15',
    status: 'Draft',
    content: 'The yield curve is a high-fidelity graphical representation of interest rates across various maturities. It shows the critical relationship between bond yields and time. Historically, a normal yield curve is upward sloping, but an inversion (where short term rates exceed long term) often signals an upcoming recession. For example, the 2023 inversion was a major focal point for macro analysts.',
    metadata: {
      wordCount: 1680,
      readingTime: 8,
      qualityScore: 88,
      badges: ['In Progress']
    }
  }
];

const mockVersionData: VersionControlData = {
  articleId: 'art-1',
  articleTitle: 'Understanding Yield Curve Dynamics',
  versions: mockVersions,
  timeline: [
    { date: '2025-05-12', editor: 'Daniel Harris', event: 'Article Created', summary: 'Initial draft of the yield curve research node.', type: 'creation' },
    { date: '2025-06-05', editor: 'Sarah Collins', event: 'Editorial Review', summary: 'Audit of interest rate benchmarks and citations.', type: 'review' },
    { date: '2025-06-08', editor: 'Sarah Collins', event: 'Version 1.1 Published', summary: 'Updated explanation with recession signaling logic.', type: 'publication' },
    { date: '2025-07-15', editor: 'Michael Grant', event: 'Major Revision', summary: 'Added real-world examples from the 2023 cycle.', type: 'edit' }
  ]
};

export const getVersionHistory = async (articleId: string): Promise<ApiResponse<VersionControlData>> => {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return {
    data: mockVersionData,
    status: 200,
  };
};
