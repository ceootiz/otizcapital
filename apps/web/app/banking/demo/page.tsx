import type { Metadata } from "next";
import { DemoCabinetSkeleton, ProductShell } from "@/components/banking/banking-components";

export const metadata: Metadata = {
  title: "Демо-кабинет | Финансовый навигатор",
  description:
    "Демо-кабинет финансового навигатора с выбором банка, сценарием бизнеса, операциями, комиссиями, рисками и рекомендацией."
};

export default function BankingDemoPage() {
  return (
    <ProductShell active="cabinet">
      <DemoCabinetSkeleton />
    </ProductShell>
  );
}
