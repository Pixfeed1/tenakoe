import FormulairePrescripteurPage from "../page";

export default function FormulaireAvecPrescripteur({
  params,
}: {
  params: Promise<{ prescripteur: string }>;
}) {
  return <FormulairePrescripteurPage paramsPromise={params} />;
}
