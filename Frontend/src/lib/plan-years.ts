export type YearOption = { value: string; label: string }

const PLAN_LABELS: Record<string, string> = {
    "2024": "Plan de trabajo A",
    "2023": "Plan de trabajo B",
    "2022": "Plan de trabajo C",
}

export function getYearOptions(isStoreC: boolean, count = 5): YearOption[] {
    const currentYear = new Date().getFullYear()
    const options: YearOption[] = []
    for (let i = 0; i < count; i += 1) {
        const year = String(currentYear - i)
        const label = isStoreC && PLAN_LABELS[year] ? PLAN_LABELS[year] : year
        options.push({ value: year, label })
    }
    return options
}

export function getPlanLabel(isStoreC: boolean, year: string): string {
    if (isStoreC && PLAN_LABELS[year]) return PLAN_LABELS[year]
    return year
}
