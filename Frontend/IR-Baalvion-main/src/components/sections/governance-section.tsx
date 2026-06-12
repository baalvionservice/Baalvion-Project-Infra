import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { leadershipTeam } from "@/lib/data";
import { PlaceHolderImages, placeholderImage } from "@/lib/placeholder-images";

const initials = (name: string) =>
  name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

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
            const hasPhoto = !!memberImage && memberImage.imageUrl !== placeholderImage;
            return (
              <Card key={member.name} className="flex flex-col">
                <CardHeader className="items-center text-center">
                  {hasPhoto ? (
                    <Image
                      src={memberImage!.imageUrl}
                      alt={`Photo of ${member.name}`}
                      data-ai-hint={memberImage!.imageHint}
                      width={128}
                      height={128}
                      className="size-32 rounded-full object-cover object-top mb-4 ring-1 ring-border"
                    />
                  ) : (
                    <div className="mb-4 flex size-32 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-muted text-3xl font-semibold text-primary ring-1 ring-border">
                      {initials(member.name)}
                    </div>
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
          <h3 className="text-2xl font-bold">Strategic Operator Network</h3>
          <p className="mt-4 max-w-3xl mx-auto text-muted-foreground">
            Alongside our core leadership, Baalvion engages a select network of experienced operators and advisors across logistics, trade finance and technology. This framework aligns long-term incentives with the people who help execute our strategy — strengthening governance, accountability and the depth of expertise behind every decision.
          </p>
        </div>
      </div>
    </section>
  );
}
