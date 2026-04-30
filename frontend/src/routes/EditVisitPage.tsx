import { useNavigate, useParams, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { visitsService } from "../services/visits.service";
import { visitItemsService } from "../services/visit-items.service";
import { VisitForm } from "../components/visits/VisitForm";
import { BackButton } from "../components/ui/BackButton";
import type { Visit } from "../types/visit";
import type { VisitItem } from "../types/visit-item";

type LocationState = { visit?: Visit };
type ItemPayload = Partial<Omit<VisitItem, "photo">> & { photo?: string | File };

export default function EditVisitPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { t } = useTranslation();
  const state = (useLocation().state ?? {}) as LocationState;
  const visit = state.visit;

  return (
    <div className="max-w-xl mx-auto p-4">
      <BackButton />
      <h1 className="text-2xl font-bold mb-4">{t("visitForm.editTitle")}</h1>
      <VisitForm
        initial={visit}
        initialItems={visit?.items ?? []}
        onSubmit={async (visitData, items) => {
          await visitsService.update(Number(id), visitData);
          for (const it of items as ItemPayload[]) {
            if (it.id) {
              await visitItemsService.update(it.id, it);
            } else {
              await visitItemsService.create(Number(id), it);
            }
          }
          nav(-1);
        }}
      />
    </div>
  );
}
