/**
 * Real people only.
 *
 * Four entries here were not Baalvion's: Susan Chan, Tarek Chouman, Alex Claringbull and
 * Samara Cohen are BlackRock executives, listed on this company's public, crawlable team
 * page — which also emits Person structured data — under their real or near-real BlackRock
 * titles. The site's design was modelled on BlackRock's; the leadership roster came along
 * with it. Naming other companies' officers as your own is not a placeholder problem, so
 * they are removed rather than relabelled.
 *
 * "Aladdin" is BlackRock's platform, not a Baalvion product; it has been dropped from the
 * two engineering titles that carried it.
 *
 * The bios were a single template with a name swapped in, and often the wrong name — the
 * CEO's bio described a different person entirely, as did the Director's. A wrong bio is
 * worse than none, so `bio` is now optional and unset. Add real ones when they exist; the
 * cards render without it.
 *
 * Still unresolved and deliberately left alone: two people carry the title Chief Executive
 * Officer. That is a fact about the company, not something to guess at here.
 */
export type Leader = {
  name: string;
  title: string;
  imageId?: string;
  bio?: string;
};

export const leadershipTeam: Leader[] = [
  { name: 'Deepak Kumar Kuldeep', title: 'Founder & Chief Visionary Officer', imageId: 'founder-photo' },
  { name: 'Tamanna shaikh',       title: 'Chief Executive Officer',           imageId: 'tamanna-photo' },
  { name: 'Dilip Kumar Kuldeep',  title: 'Director',                          imageId: 'dilip-photo' },
  { name: 'Adarsh Patra',         title: 'Chief Executive Officer',           imageId: 'executive-1-photo' },
];

export const globalLeaders: Leader[] = [
  { name: 'Parthamesh Pawer',       title: 'Co-Head of the Global Partners Office', imageId: 'prathamesh-photo' },
  { name: 'Laxman Singh Champia',   title: 'Co-Head of Product Engineering',        imageId: 'laxman-photo' },
  { name: 'Rashmika Singh',         title: 'Co-Head of Product Engineering',        imageId: 'rashmika-photo' },
  { name: 'Preeti snigdha Mallick', title: 'Deputy General Counsel',                imageId: 'preeti-photo' },
];

// export const VicePersidents = [
//   {
//     name: 'Sasmita Gemel',
//     title: 'Vice President',
//     position: 'Marketing Communications',
//     imageId: 'sasmita-photo',
//     bio: 'Sasmita is responsible for marketing and communications at Baalvion. With a career spanning over 15 years in the industry, she brings a wealth of knowledge and experience to her role.',
//   },
//   {
//     name: 'Vishal Kumar Pingua',
//     title: 'Vice President',
//     imageId: 'bishal-photo',
//     position: 'Corporate Development',
//     bio: 'Vishal is in charge of corporate development at Baalvion. His expertise lies in identifying new business opportunities and forging strategic partnerships that drive growth.',
//   },
//   {
//     name: 'Biswajeet Patra',
//     title: 'Vice President',
//     imageId: 'biswajeet-photo',
//     position: 'Corporate Counsel',
//     bio: 'Biswajeet is the corporate counsel for Baalvion. He ensures that all business activities are conducted in compliance with relevant laws and regulations.',
//   },
//   {
//     name: 'Jaid Alam',
//     title: 'Vice President',
//     imageId: 'jaid-photo',
//     position: 'Worldwide Sales',
//     bio: 'Jaid leads Baalvion sales efforts worldwide. With a proven track record in sales leadership, he is dedicated to expanding our client base and driving revenue growth.',
//   },
//   {
//     name: 'Joe DeVico',
//     title: 'Vice President',
//     position: 'Marketing Communications',
//     imageId: 'joe-photo',
//     bio: 'Joe is responsible for marketing and communications at Baalvion. With a career spanning over 15 years in the industry, he brings a wealth of knowledge and experience to his role.',
//   },
//   {
//     name: 'Joe DeVico',
//     title: 'Vice President',
//     position: 'Marketing Communications',
//     imageId: 'joe-photo',
//     bio: 'Joe is responsible for marketing and communications at Baalvion. With a career spanning over 15 years in the industry, he brings a wealth of knowledge and experience to his role.',
//   },
//   {
//     name: 'Joe DeVico',
//     title: 'Vice President',
//     position: 'Marketing Communications',
//     imageId: 'joe-photo',
//     bio: 'Joe is responsible for marketing and communications at Baalvion. With a career spanning over 15 years in the industry, he brings a wealth of knowledge and experience to his role.',
//   },
//   {
//     name: 'Joe DeVico',
//     title: 'Vice President',
//     position: 'Marketing Communications',
//     imageId: 'joe-photo',
//     bio: 'Joe is responsible for marketing and communications at Baalvion. With a career spanning over 15 years in the industry, he brings a wealth of knowledge and experience to his role.',
//   },
// ];
