
"use client";

import * as React from "react";
import { format, setMonth, setYear } from "date-fns";
import { Calendar } from "@/components/ui/calendar-origin";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";

function DropdownDatePicker({ selected, onSelect }) {
    const today = new Date();
    const [month, setMonthVal] = React.useState(selected ? new Date(selected).getMonth() : today.getMonth());
    const [year, setYearVal] = React.useState(selected ? new Date(selected).getFullYear() : today.getFullYear());
    const [isOpen, setIsOpen] = React.useState(false);
    const [view, setView] = React.useState("calendar"); // "calendar", "month", "year"

    const displayMonth = new Date(year, month, 1);
    const formattedValue = selected ? format(new Date(selected), "PPP") : "Select your date of birth";

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

    const handleDateSelect = (date) => {
        if (date) {
            onSelect(date);
            setIsOpen(false);
        }
    };

    const handleMonthSelect = (m) => {
        setMonthVal(m);
        setView("calendar");
    };

    const handleYearSelect = (y) => {
        setYearVal(y);
        setView("calendar");
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "w-full justify-start text-left font-bold transition-all duration-300 rounded-[1rem] h-14 border-2 group",
                        selected ? "text-gray-900 border-black" : "text-gray-400 border-gray-100 hover:border-gray-200"
                    )}
                >
                    <CalendarIcon className={cn("mr-3 h-5 w-5 shrink-0 transition-colors", selected ? "text-black" : "text-gray-300 group-hover:text-gray-400")} />
                    <span className="truncate overflow-hidden text-sm uppercase tracking-wide">{formattedValue}</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-80 p-0 bg-white border border-gray-100 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] rounded-[2rem] overflow-hidden"
                align="start"
                sideOffset={8}
            >
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col h-full"
                >
                    {/* Header with 2 Sections: Month and Year Selection */}
                    <div className="p-4 grid grid-cols-2 gap-2 border-b border-gray-50 bg-gray-50/50">
                        <button
                            onClick={() => setView(view === 'month' ? 'calendar' : 'month')}
                            className={cn(
                                "flex items-center justify-between px-4 py-2 bg-white rounded-xl border border-gray-100 hover:border-black transition-all group",
                                view === 'month' && "border-black shadow-sm"
                            )}
                        >
                            <span className="text-xs font-black uppercase tracking-wider">{months[month].slice(0, 3)}</span>
                            <ChevronDown className={cn("w-3 h-3 text-gray-400 group-hover:text-black transition-transform", view === 'month' && "rotate-180")} />
                        </button>
                        <button
                            onClick={() => setView(view === 'year' ? 'calendar' : 'year')}
                            className={cn(
                                "flex items-center justify-between px-4 py-2 bg-white rounded-xl border border-gray-100 hover:border-black transition-all group",
                                view === 'year' && "border-black shadow-sm"
                            )}
                        >
                            <span className="text-xs font-black uppercase tracking-wider">{year}</span>
                            <ChevronDown className={cn("w-3 h-3 text-gray-400 group-hover:text-black transition-transform", view === 'year' && "rotate-180")} />
                        </button>
                    </div>

                    <div className="p-4 min-h-[300px] flex items-center justify-center relative">
                        <AnimatePresence mode="wait">
                            {view === "calendar" && (
                                <motion.div
                                    key="calendar"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    className="w-full"
                                >
                                    <Calendar
                                        mode="single"
                                        selected={selected ? new Date(selected) : undefined}
                                        onSelect={handleDateSelect}
                                        month={displayMonth}
                                        onMonthChange={(date) => {
                                            setMonthVal(date.getMonth());
                                            setYearVal(date.getFullYear());
                                        }}
                                        className="p-0 pointer-events-auto"
                                    />
                                </motion.div>
                            )}

                            {view === "month" && (
                                <motion.div
                                    key="month"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="grid grid-cols-3 gap-2 w-full h-[280px] overflow-y-auto custom-scrollbar p-2"
                                >
                                    {months.map((m, i) => (
                                        <button
                                            key={m}
                                            onClick={() => handleMonthSelect(i)}
                                            className={cn(
                                                "p-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                                                month === i
                                                    ? "bg-black text-white"
                                                    : "bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-black"
                                            )}
                                        >
                                            {m.slice(0, 3)}
                                        </button>
                                    ))}
                                </motion.div>
                            )}

                            {view === "year" && (
                                <motion.div
                                    key="year"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="grid grid-cols-3 gap-2 w-full h-[280px] overflow-y-auto custom-scrollbar p-2"
                                >
                                    {years.map((y) => (
                                        <button
                                            key={y}
                                            onClick={() => handleYearSelect(y)}
                                            className={cn(
                                                "p-3 rounded-xl text-xs font-bold transition-all",
                                                year === y
                                                    ? "bg-black text-white"
                                                    : "bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-black"
                                            )}
                                        >
                                            {y}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </PopoverContent>
        </Popover>
    );
}

export { DropdownDatePicker };
