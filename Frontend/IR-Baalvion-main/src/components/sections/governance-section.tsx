import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { leadershipTeam } from "@/lib/data";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function GovernanceSection({ id }: { id: string }) {
  return (
    <section id={id} className="w-full py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">
            Governance & Leadership
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
            Our leadership comprises seasoned industry veterans committed to transparent governance, strategic execution, and long-term value creation.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {leadershipTeam.map((member) => {
            const memberImage = PlaceHolderImages.find((p) => p.id === member.imageId);
            return (
              <Card key={member.name} className="flex flex-col">
                <CardHeader className="items-center text-center">
                  {memberImage && (
                    <Image
                      src={memberImage.imageUrl}
                      alt={`Photo of ${member.name}`}
                      data-ai-hint={memberImage.imageHint}
                      width={120}
                      height={120}
                      className="size-32 rounded-full object-cover mb-4"
                    />
                  )}
                  <CardTitle>{member.name}</CardTitle>
                  <p className="text-sm font-medium text-primary">{member.title}</p>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-muted-foreground">{member.bio}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold">Elite Operator Framework (Phase 3 Teaser)</h3>
          <p className="mt-4 max-w-3xl mx-auto text-muted-foreground">
            In addition to our core leadership, Baalvion is pioneering an equity framework for a select group of the world's top 30 operators. This initiative reserves a dedicated equity pool for industry leaders who provide strategic value, ensuring a deep alignment of interests and unparalleled execution capability. Access to this program is by invitation only and represents the pinnacle of strategic partnership within our ecosystem.
          </p>
        </div>
      </div>
    </section>
  );
}
