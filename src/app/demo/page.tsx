import type { Metadata } from "next";
import { DemoApp } from "@/modules/demo/demo-app";

export const metadata: Metadata = {
  title: "Demonstração",
  description: "Explore o BeautyFlow com dados fictícios, sem criar uma conta.",
};

export default function DemoPage() {
  return <DemoApp />;
}
