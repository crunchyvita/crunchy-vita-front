export const NUTRITION_ROWS = [
  {
    key: "energy",
    label: "Energie",
    placeholder100g: "1435 kJ / 343 kcal",
    placeholderServing: "230 kJ / 55 kcal",
  },
  {
    key: "fat",
    label: "Matieres grasses",
    placeholder100g: "0,82 g",
    placeholderServing: "0,13 g",
  },
  {
    key: "saturatedFat",
    label: "Dont saturees",
    placeholder100g: "0,06 g",
    placeholderServing: "0,01 g",
  },
  {
    key: "carbohydrates",
    label: "Glucides",
    placeholder100g: "90 g",
    placeholderServing: "14,4 g",
  },
  {
    key: "sugars",
    label: "Dont sucres",
    placeholder100g: "68 g",
    placeholderServing: "10,9 g",
  },
  {
    key: "protein",
    label: "Proteines",
    placeholder100g: "3,7 g",
    placeholderServing: "0,59 g",
  },
  {
    key: "salt",
    label: "Sel",
    placeholder100g: "0,02 g",
    placeholderServing: "0,003 g",
  },
  {
    key: "fiber",
    label: "Fibres alimentaires",
    placeholder100g: "~ 9,6 g",
    placeholderServing: "~ 1,5 g",
  },
];

const createEmptyNutritionValues = () => ({
  energy: "",
  fat: "",
  saturatedFat: "",
  carbohydrates: "",
  sugars: "",
  fiber: "",
  protein: "",
  salt: "",
});

const normalizeNutritionValue = (value) => {
  if (value === undefined || value === null) return "";
  return String(value).trim();
};

export const createEmptyNutrition = () => ({
  servingLabel: "",
  per100g: createEmptyNutritionValues(),
  perServing: createEmptyNutritionValues(),
});

export const normalizeNutrition = (nutrition) => {
  const normalized = createEmptyNutrition();

  if (!nutrition || typeof nutrition !== "object") {
    return normalized;
  }

  normalized.servingLabel = normalizeNutritionValue(nutrition.servingLabel);

  ["per100g", "perServing"].forEach((columnKey) => {
    const source = nutrition[columnKey];
    if (!source || typeof source !== "object") return;

    NUTRITION_ROWS.forEach(({ key }) => {
      normalized[columnKey][key] = normalizeNutritionValue(source[key]);
    });
  });

  return normalized;
};

export const hasNutritionData = (nutrition) => {
  const normalized = normalizeNutrition(nutrition);

  if (normalized.servingLabel) {
    return true;
  }

  return NUTRITION_ROWS.some(
    ({ key }) => normalized.per100g[key] || normalized.perServing[key]
  );
};