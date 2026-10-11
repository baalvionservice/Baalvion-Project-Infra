import { Metadata } from "next";
import { LotteryClient } from "./lottery-client";

export const metadata: Metadata = {
  title: "Club Ticket Draw | Baalvion",
  description: "Enter the club ticket draw with your wallet points. Winners are picked by a recorded random draw and listed by member number.",
  alternates: { canonical: "/clubs/lottery" },
};

export default function LotteryPage() {
  return <LotteryClient />;
}
