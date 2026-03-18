import { NUTRITION_ROWS, normalizeNutrition } from "@/lib/nutrition";

const defaultLabels = {
  title: "Tableau nutritionnel",
  infoHeader: "Infos nutritionnelles",
  per100gHeader: "100 g",
  perServingFallback: "",
  rows: {},
};

export default function NutritionTable({
  nutrition,
  labels = {},
  className = "",
  tableMaxWidthClass = "max-w-3xl",
  hideEmptyRows = false,
  emptyValuePlaceholder = "-",
}) {
  const mergedLabels = {
    ...defaultLabels,
    ...labels,
    rows: {
      ...defaultLabels.rows,
      ...(labels.rows || {}),
    },
  };
  const normalizedNutrition = normalizeNutrition(nutrition);
  const servingHeader = labels.perServingHeader || normalizedNutrition.servingLabel || "";

  const isFilledValue = (value) => String(value ?? "").trim().length > 0;

  const showPerServingColumn = NUTRITION_ROWS.some((row) =>
    isFilledValue(normalizedNutrition.perServing[row.key])
  );

  const rowsToRender = hideEmptyRows
    ? NUTRITION_ROWS.filter((row) => {
        const per100gValue = normalizedNutrition.per100g[row.key];
        const perServingValue = normalizedNutrition.perServing[row.key];
        return isFilledValue(per100gValue) || isFilledValue(perServingValue);
      })
    : NUTRITION_ROWS;

  return (
    <div className={className}>
      {mergedLabels.title ? (
        <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 sm:text-2xl">
          {mergedLabels.title}
        </h3>
      ) : null}

      <div
        className={`mt-5 mx-auto w-full ${tableMaxWidthClass} overflow-x-auto rounded-[2rem] border border-slate-300 shadow-sm`}
      >
        <table className="min-w-full overflow-hidden bg-white text-left">
          <thead>
            <tr className="text-white" style={{ backgroundColor: "#556822" }}>
              <th className="px-4 py-3 text-xs font-black uppercase tracking-[0.14em] sm:px-5 sm:py-3.5">
                {mergedLabels.infoHeader}
              </th>
              <th className="px-4 py-3 text-center text-xs font-black uppercase tracking-[0.14em] sm:px-5 sm:py-3.5">
                {mergedLabels.per100gHeader}
              </th>
              {showPerServingColumn && (
                <th className="px-4 py-3 text-center text-xs font-black uppercase tracking-[0.14em] sm:px-5 sm:py-3.5">
                  {servingHeader}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {rowsToRender.map((row, index) => (
              <tr
                key={row.key}
                className={index % 2 === 0 ? "bg-slate-50 text-slate-900" : "bg-slate-100 text-slate-900"}
              >
                <th className="border-t border-slate-300 px-4 py-2.5 text-xs font-bold sm:px-5 sm:py-3 sm:text-sm">
                  {mergedLabels.rows[row.key] || row.label}
                </th>
                <td className="border-t border-slate-300 px-4 py-2.5 text-center text-xs font-semibold sm:px-5 sm:py-3 sm:text-sm">
                  {normalizedNutrition.per100g[row.key] || emptyValuePlaceholder}
                </td>
                {showPerServingColumn && (
                  <td className="border-t border-slate-300 px-4 py-2.5 text-center text-xs font-semibold sm:px-5 sm:py-3 sm:text-sm">
                    {normalizedNutrition.perServing[row.key] || emptyValuePlaceholder}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}