"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"
import { es } from 'date-fns/locale'
import "react-day-picker/dist/style.css"

type CalendarProps = {
    mode?: "single" | "multiple" | "range"
    selected?: Date | Date[] | { from?: Date; to?: Date } | undefined
    onSelect?: (date: any) => void
    initialFocus?: boolean
    className?: string
}

export function Calendar({ mode = "single", selected, onSelect, initialFocus, className }: CalendarProps) {
    const ref = React.useRef<HTMLDivElement | null>(null)

    React.useEffect(() => {
        if (initialFocus && ref.current) {
            const button = ref.current.querySelector<HTMLButtonElement>("button[tabindex='0']")
            if (button) button.focus()
        }
    }, [initialFocus])

    return (
        <div ref={ref} className={`bg-background border rounded-md shadow-md p-2 ${className ?? ""}`}>
            <DayPicker
                mode={mode as any}
                selected={selected as any}
                onSelect={onSelect as any}
                className="rdp bg-transparent text-sm"
                locale={es}
                modifiersClassNames={{
                    selected: "bg-primary text-primary-foreground rounded",
                    today: "outline outline-1 outline-muted/50 rounded",
                }}
                weekStartsOn={1}
            />
        </div>
    )
}

export default Calendar
