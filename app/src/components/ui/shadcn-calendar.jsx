
"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"


function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    ...props
}) {
    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            className={cn("p-4", className)}
            classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-6",
                caption: "flex justify-between pt-1 relative items-center px-2 mb-4",
                caption_label: "text-base font-black text-gray-900 tracking-tight",
                nav: "flex items-center gap-1",
                nav_button: cn(
                    "h-9 w-9 bg-white border border-gray-100 text-gray-400 hover:text-black hover:bg-gray-50 hover:border-gray-200 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm"
                ),
                nav_button_previous: "relative",
                nav_button_next: "relative",
                table: "w-full border-collapse",
                head_row: "flex mb-2",
                head_cell: "text-gray-400 rounded-md w-10 font-black text-[0.7rem] uppercase tracking-widest",
                row: "flex w-full mt-1.5",
                cell: cn(
                    "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-transparent",
                    "[&:has([aria-selected].day-outside)]:bg-transparent",
                    "[&:has([aria-selected].day-range-end)]:rounded-r-xl",
                    "first:[&:has([aria-selected])]:rounded-l-xl last:[&:has([aria-selected])]:rounded-r-xl"
                ),
                day: cn(
                    "h-10 w-10 p-0 font-bold transition-all duration-300 rounded-xl flex items-center justify-center",
                    "hover:bg-gray-50 hover:text-black border-2 border-transparent",
                    "aria-selected:bg-black aria-selected:text-white aria-selected:border-black aria-selected:scale-110 aria-selected:shadow-xl aria-selected:shadow-black/10 aria-selected:z-10"
                ),
                day_selected: "bg-black text-white hover:bg-black hover:text-white focus:bg-black focus:text-white",
                day_today: "bg-gray-50 text-black border-2 border-gray-100",
                day_outside: "day-outside text-gray-300 opacity-50 aria-selected:bg-black/5 aria-selected:text-gray-400 aria-selected:opacity-30",
                day_disabled: "text-gray-300 opacity-50",
                day_range_middle: "aria-selected:bg-gray-50 aria-selected:text-black",
                day_hidden: "invisible",
                ...classNames,
            }}
            components={{
                IconLeft: ({ ...props }) => <ChevronLeft className="h-5 w-5" />,
                IconRight: ({ ...props }) => <ChevronRight className="h-5 w-5" />,
            }}
            {...props}
        />
    )
}

Calendar.displayName = "Calendar"

export { Calendar }
