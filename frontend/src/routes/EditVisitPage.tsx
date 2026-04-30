import { useNavigate, useParams } from "react-router-dom";
import { visitsService } from "../services/visits.service";
import { VisitForm } from "../components/visits/VisitForm";

export default function EditVisitPage() {
  const { id } = useParams();
  const nav = useNavigate();

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Edit visit</h1>
      <VisitForm
        onSubmit={async (visit) => {
          await visitsService.update(Number(id), visit);
          nav(-1 as any);
        }}
      />
    </div>
  );
}
