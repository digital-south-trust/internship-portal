"use client";

import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const calendarVariants = cva(
  "inline-block space-y-4 rounded-[0.8rem] border border-border bg-background relative w-full max-w-sm mx-auto shadow-md",
  {
    variants: {
      size: {
        sm: "p-2 sm:p-3 text-sm",
        default: "p-3 sm:p-4",
        lg: "p-4 sm:p-5 text-base",
      },
      alwaysOnTop: {
        true: "z-[9999]",
        false: "z-10",
      },
    },
    defaultVariants: {
      size: "default",
      alwaysOnTop: true,
    },
  }
);

const dayVariants = cva(
  "inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-[0.8rem] text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "text-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring",
        selected:
          "bg-black text-white hover:bg-black/90 focus-visible:ring-ring font-semibold shadow-md",
        today:
          "bg-accent text-accent-foreground font-semibold hover:bg-accent/80 focus-visible:ring-ring border border-black/10",
        outside:
          "text-muted-foreground opacity-30 hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring",
        disabled:
          "text-muted-foreground opacity-10 cursor-not-allowed",
      },
      size: {
        sm: "h-6 w-6 sm:h-7 sm:w-7 text-xs",
        default: "h-8 w-8 sm:h-9 sm:w-9 text-sm",
        lg: "h-9 w-9 sm:h-10 sm:w-10 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function Calendar({
  selected,
  onSelect,
  disabled,
  locale = "en-US",
  className,
  size,
  showOutsideDays = true,
  minDate,
  maxDate,
  mode = "single",
  selectedDates = [],
  selectedRange,
  onSelectMultiple,
  onSelectRange,
  showMonthYearPickers = true,
  alwaysOnTop = true,
  ...props
}) {
  const [currentDate, setCurrentDate] = React.useState(selected || new Date());
  const [isAnimating, setIsAnimating] = React.useState(false);
  const [direction, setDirection] = React.useState("right");
  const today = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const yearRange = Array.from({ length: 101 }, (_, i) => new Date().getFullYear() - 80 + i);

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const firstDayOfWeek = firstDayOfMonth.getDay();
  const daysInMonth = lastDayOfMonth.getDate();

  const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
  const prevMonthDays = Array.from(
    { length: firstDayOfWeek },
    (_, i) => prevMonthLastDay - firstDayOfWeek + i + 1
  );

  const totalCells = 42; 
  const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const remainingCells =
    totalCells - prevMonthDays.length - currentMonthDays.length;
  const nextMonthDays = Array.from({ length: remainingCells }, (_, i) => i + 1);

  const navigateMonth = (direction) => {
    setIsAnimating(true);
    setDirection(direction === "prev" ? "left" : "right");

    setTimeout(() => {
      const newDate = new Date(currentDate);
      if (direction === "prev") {
        newDate.setMonth(currentMonth - 1);
      } else {
        newDate.setMonth(currentMonth + 1);
      }
      setCurrentDate(newDate);
      setIsAnimating(false);
    }, 150);
  };

  const handleMonthChange = (month) => {
    const monthIndex = parseInt(month, 10);
    const newDate = new Date(currentDate);
    newDate.setMonth(monthIndex);
    setCurrentDate(newDate);
  };

  const handleYearChange = (year) => {
    const yearValue = parseInt(year, 10);
    const newDate = new Date(currentDate);
    newDate.setFullYear(yearValue);
    setCurrentDate(newDate);
  };

  const isDateDisabled = (date) => {
    if (disabled?.(date)) return true;
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const isDateSelected = (date) => {
    if (mode === "single") {
      return selected && isSameDay(date, selected);
    }
    return false;
  };

  const isToday = (date) => isSameDay(date, today);

  const handleDateClick = (day, monthOffset = 0) => {
    const clickedDate = new Date(currentYear, currentMonth + monthOffset, day);
    if (isDateDisabled(clickedDate)) return;
    if (mode === "single") {
      onSelect?.(clickedDate);
    }
  };

  const getDayVariant = (day, monthOffset = 0) => {
    const date = new Date(currentYear, currentMonth + monthOffset, day);
    if (isDateDisabled(date)) return "disabled";
    if (isDateSelected(date)) return "selected";
    if (isToday(date)) return "today";
    if (monthOffset !== 0) return "outside";
    return "default";
  };

  return (
    <div
      className={cn(calendarVariants({ size, alwaysOnTop }), className)}
      {...props}
    >
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigateMonth("prev")}
          className="p-1 hover:bg-accent rounded-lg"
          disabled={isAnimating}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex gap-2">
          <Select value={currentMonth.toString()} onValueChange={handleMonthChange}>
            <SelectTrigger className="h-8 w-[100px] text-[13px] font-bold" variant="ghost">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => (
                <SelectItem key={i} value={i.toString()}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={currentYear.toString()} onValueChange={handleYearChange}>
            <SelectTrigger className="h-8 w-[95px] text-[13px] font-bold px-1" variant="ghost">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearRange.map(y => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <button
          type="button"
          onClick={() => navigateMonth("next")}
          className="p-1 hover:bg-accent rounded-lg"
          disabled={isAnimating}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {DAYS_OF_WEEK.map(d => (
          <div key={d} className="h-7 flex items-center justify-center text-[10px] font-black uppercase text-gray-400">
            {d[0]}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {prevMonthDays.map(d => (
          <button key={`p-${d}`} type="button" onClick={() => handleDateClick(d, -1)} className={cn(dayVariants({ variant: getDayVariant(d, -1), size }))}>
            {d}
          </button>
        ))}
        {currentMonthDays.map(d => (
          <button key={`c-${d}`} type="button" onClick={() => handleDateClick(d)} className={cn(dayVariants({ variant: getDayVariant(d), size }))}>
            {d}
          </button>
        ))}
        {nextMonthDays.map(d => (
          <button key={`n-${d}`} type="button" onClick={() => handleDateClick(d, 1)} className={cn(dayVariants({ variant: getDayVariant(d, 1), size }))}>
            {d}
          </button>
        ))}
      </div>
    </div>
  );
}

function isSameDay(d1, d2) {
  return d1 && d2 && d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
}

export { Calendar };
