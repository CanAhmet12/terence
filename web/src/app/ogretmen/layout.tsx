import type { Metadata } from "next";
import { TeacherLayoutClient } from "./TeacherLayoutClient";

export const metadata: Metadata = {
  title: "Öğretmen Paneli",
  description: "Terence Eğitim öğretmen paneli — sınıf yönetimi, canlı ders, ödev atama ve içerik yükleme.",
  robots: { index: false, follow: false },
};

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <TeacherLayoutClient>{children}</TeacherLayoutClient>;
}
