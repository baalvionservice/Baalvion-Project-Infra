import Image from "next/image";
import {
  ReviewBoardMember,
  reviewBoardMembers,
} from "./components/data.reviewboards";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";


export async function generateMetadata() {
  return buildMetadata({
    title: "Imperialpedia Financial Review Board",
    description: "Meet the experts who fact check and review our content to ensure accuracy and empower our readers to make smarter financial decisions.",
    canonical: "/imperialpedia-review-board",
  });
}

export default function ReviewBoardPage() {
  return (
    <div className="container mt-16 mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-4xl tracking-wider font-bold mb-6">
        Imperialpedia Financial Review Board
      </h1>
      <p className="text-lg leading-7 tracking-wide text-muted-foreground mb-4">
        Imperialpedia's high quality content is written by experts and fact
        checked to ensure that our readers are receiving the most accurate and
        timely information. The Financial Review Board takes our commitment to
        accuracy one step further. Composed of professionals with a wide range
        of expertise in the financial industry, the review board includes
        university professors, certified financial planners, certified public
        accountants, entrepreneurs, analysts, economists, investors, and tax
        experts. Members of the board read, review, and provide updates on our
        content to our editorial team so that the readers of Imperialpedia can
        feel empowered to make smarter financial decisions with the most
        accurate information.
      </p>
      {/* You can add more content here, such as a list of profiles or articles */}

      <div className="mt-8">
        <h3 className="text-3xl mb-3">Who is On the Board?</h3>
        <p className="mb-3 leading-7 tracking-wide">
          The Financial Review Board includes experts with more than 100 years
          of combined financial experience, across every facet of the economy
          and personal finances. These experts were carefully selected based on
          their credentials and ability to communicate complex information to a
          broad readership to ensure our articles are empowering, unbiased,
          accurate, and inclusive.
        </p>
        {reviewBoardMembers.map((member) => {
          return <SingleProfile key={member.name} profile={member} />;
        })}
      </div>
    </div>
  );
}

function SingleProfile({ profile }: { profile: ReviewBoardMember }) {
  return (
    <div className="mb-8 py-6 flex flex-col md:flex-row gap-4">
      <div className="flex flex-col items-start gap-2 w-64">
        <div className="h-64 aspect-square w-full ">
          <Image
            src={profile.image}
            width={200}
            height={200}
            alt={profile.name}
            className="w-full object-top h-full object-cover grayscale"
          />
        </div>
        <h2 className="text-3xl font-bold ">{profile.name}</h2>
        <p className="text-muted-foreground mb-3">{profile.role}</p>
      </div>
      <div className="flex-1">
        <p className="text-foreground leading-relaxed">{profile.shortBio}</p>
        <Link
          href={`/imperialpedia-review-board/${profile.slug}`}
          className="text-primary mt-4 underline hover:no-underline inline-block"
        >
          Read more
        </Link>
      </div>
    </div>
  );
}
