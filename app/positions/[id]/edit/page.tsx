import PositionForm from "@/components/PositionForm";
export default function Page({ params }: { params: { id: string } }) {
  return <PositionForm editId={params.id} />;
}
