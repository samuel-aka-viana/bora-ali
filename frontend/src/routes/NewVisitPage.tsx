import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { visitsService } from "../services/visits.service";
import { visitItemsService } from "../services/visit-items.service";
import { VisitForm } from "../components/visits/VisitForm";
import { BackButton } from "../components/ui/BackButton";
import { LanguageToggle } from "../components/ui/LanguageToggle";

export default function NewVisitPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="max-w-xl mx-auto p-4">
      <div className="flex items-center justify-between gap-3">
        <BackButton fallbackTo={`/places/${id}`} />
        <LanguageToggle />
      </div>
      <h1 className="text-2xl font-bold mb-4">{t("visitForm.newTitle")}</h1>
      <VisitForm
        onSubmit={async (visit, items) => {
          const created = await visitsService.create(Number(id), visit);
          for (const it of items) {
            await visitItemsService.create(created.id, it);
          }
          nav(`/places/${id}`);
        }}
      />
    </div>
  );
}
