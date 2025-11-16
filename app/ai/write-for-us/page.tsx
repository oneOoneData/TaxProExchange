import { Metadata } from "next";
import WriteForUsClient from "./WriteForUsClient";

export const metadata: Metadata = {
  title: "Write for TaxProExchange | AI Hub for Tax Professionals",
  description: "Share your practical insights on how AI is transforming tax and accounting. Get featured on TaxProExchange AI Hub and reach professionals nationwide.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function WriteForUsPage() {
  return <WriteForUsClient />;
}
