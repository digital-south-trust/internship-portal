"use client";
import * as React from "react"
import {
  add,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  isEqual,
  isSameDay,
  isSameMonth,
  isToday,
  parse,
  startOfToday,
  startOfWeek,
} from "date-fns"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusCircleIcon,
  SearchIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useMediaQuery } from "@/hooks/use-media-query"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Link as LinkIcon, Clock, AlignLeft, CheckCircle2, AlertTriangle, Calendar as CalendarIcon, ExternalLink } from "lucide-react"

const colStartClasses = [
  "",
  "col-start-2",
  "col-start-3",
  "col-start-4",
  "col-start-5",
  "col-start-6",
  "col-start-7",
]

export function FullScreenCalendar({
  data,
  onEventAction
}) {
  const today = startOfToday()
  const [selectedDay, setSelectedDay] = React.useState(today)
  const [currentMonth, setCurrentMonth] = React.useState(format(today, "MMM-yyyy"))
  const firstDayCurrentMonth = parse(currentMonth, "MMM-yyyy", new Date())
  const isDesktop = useMediaQuery("(min-width: 768px)")

  const days = eachDayOfInterval({
    start: startOfWeek(firstDayCurrentMonth),
    end: endOfWeek(endOfMonth(firstDayCurrentMonth)),
  })

  function previousMonth() {
    const firstDayNextMonth = add(firstDayCurrentMonth, { months: -1 })
    setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"))
  }

  function nextMonth() {
    const firstDayNextMonth = add(firstDayCurrentMonth, { months: 1 })
    setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"))
  }

  function goToToday() {
    setCurrentMonth(format(today, "MMM-yyyy"))
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Calendar Header */}
      <div
        className="flex flex-col space-y-3 p-3 md:flex-row md:items-center md:justify-between md:space-y-0 lg:flex-none">
        <div className="flex flex-auto">
          <div className="flex items-center gap-4">
            <div
              className="hidden w-20 flex-col items-center justify-center rounded-lg border bg-muted p-0.5 md:flex">
              <h1 className="p-1 text-[10px] font-black uppercase tracking-widest text-gray-400">
                {format(today, "MMM")}
              </h1>
              <div
                className="flex w-full items-center justify-center rounded-lg border-2 border-transparent bg-white shadow-sm p-0.5 text-2xl font-black text-gray-900">
                <span>{format(today, "d")}</span>
              </div>
            </div>
            <div className="flex flex-col">
              <h2 className="text-3xl font-black uppercase tracking-tighter text-gray-900 ml-1 mt-1">
                {format(firstDayCurrentMonth, "MMMM, yyyy")}
              </h2>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-2 mt-0.5">
                {format(firstDayCurrentMonth, "MMM d, yyyy")} -{" "}
                {format(endOfMonth(firstDayCurrentMonth), "MMM d, yyyy")}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 md:flex-row md:gap-4 flex-wrap justify-end">
          <div className="flex items-center gap-2 bg-gray-50 rounded-[1.5rem] p-1.5 border border-gray-100 shadow-sm relative z-10">
            <div className="relative">
              <select
                value={format(firstDayCurrentMonth, "MM")}
                onChange={(e) => {
                  const newMonth = e.target.value;
                  const currentYear = format(firstDayCurrentMonth, "yyyy");
                  const date = new Date(parseInt(currentYear), parseInt(newMonth) - 1, 1);
                  setCurrentMonth(format(date, "MMM-yyyy"));
                }}
                className="appearance-none bg-transparent pl-4 pr-8 py-3.5 text-[10px] font-black uppercase tracking-widest text-gray-900 transition-all hover:bg-white hover:shadow-sm rounded-2xl cursor-pointer outline-none"
              >
                {Array.from({ length: 12 }, (_, i) => {
                  const date = new Date(2000, i, 1);
                  return (
                    <option key={i} value={format(date, "MM")}>
                      {format(date, "MMMM")}
                    </option>
                  );
                })}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <ChevronRightIcon className="h-4 w-4 text-gray-400 rotate-90" aria-hidden="true" />
              </div>
            </div>

            <div className="w-px h-6 bg-gray-200" />

            <div className="relative">
              <select
                value={format(firstDayCurrentMonth, "yyyy")}
                onChange={(e) => {
                  const newYear = e.target.value;
                  const currentMonthStr = format(firstDayCurrentMonth, "MM");
                  const date = new Date(parseInt(newYear), parseInt(currentMonthStr) - 1, 1);
                  setCurrentMonth(format(date, "MMM-yyyy"));
                }}
                className="appearance-none bg-transparent pl-4 pr-8 py-3.5 text-[10px] font-black uppercase tracking-widest text-gray-900 transition-all hover:bg-white hover:shadow-sm rounded-2xl cursor-pointer outline-none"
              >
                {Array.from({ length: 10 }, (_, i) => {
                  const year = new Date().getFullYear() - 2 + i;
                  return (
                    <option key={year} value={year.toString()}>
                      {year}
                    </option>
                  );
                })}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <ChevronRightIcon className="h-4 w-4 text-gray-400 rotate-90" aria-hidden="true" />
              </div>
            </div>
          </div>

          <div className="inline-flex items-center bg-gray-50 rounded-[1.5rem] p-1.5 border border-gray-100 shadow-sm relative z-10">
            <button
              onClick={previousMonth}
              className="p-3.5 rounded-2xl hover:bg-white hover:shadow-sm text-gray-400 hover:text-gray-900 transition-all active:scale-95"
              aria-label="Navigate to previous month"
            >
              <ChevronLeftIcon size={18} strokeWidth={2.5} />
            </button>
            <button
              onClick={goToToday}
              className="px-8 py-3.5 text-[10px] font-black uppercase tracking-widest text-gray-900 transition-all hover:bg-white hover:shadow-sm rounded-2xl mx-1 active:scale-95"
            >
              Current Frame
            </button>
            <button
              onClick={nextMonth}
              className="p-3.5 rounded-2xl hover:bg-white hover:shadow-sm text-gray-400 hover:text-gray-900 transition-all active:scale-95"
              aria-label="Navigate to next month"
            >
              <ChevronRightIcon size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
      {/* Calendar Grid */}
      <div className="lg:flex lg:flex-auto lg:flex-col bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        {/* Week Days Header */}
        <div
          className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/50 text-center text-[10px] uppercase tracking-widest font-black text-gray-400 lg:flex-none">
          <div className="py-4 border-r border-gray-100">Sun</div>
          <div className="py-4 border-r border-gray-100">Mon</div>
          <div className="py-4 border-r border-gray-100">Tue</div>
          <div className="py-4 border-r border-gray-100">Wed</div>
          <div className="py-4 border-r border-gray-100">Thu</div>
          <div className="py-4 border-r border-gray-100">Fri</div>
          <div className="py-4">Sat</div>
        </div>

        {/* Calendar Days */}
        <div className="flex text-xs leading-6 bg-gray-100 gap-[1px] lg:flex-auto">
          <div className="hidden w-full lg:grid lg:grid-cols-7 lg:grid-rows-5 gap-[1px]">
            {days.map((day, dayIdx) =>
              !isDesktop ? (
                <button
                  onClick={() => setSelectedDay(day)}
                  key={dayIdx}
                  type="button"
                  className={cn(
                    isEqual(day, selectedDay) && "text-primary-foreground",
                    !isEqual(day, selectedDay) &&
                    !isToday(day) &&
                    isSameMonth(day, firstDayCurrentMonth) &&
                    "text-foreground",
                    !isEqual(day, selectedDay) &&
                    !isToday(day) &&
                    !isSameMonth(day, firstDayCurrentMonth) &&
                    "text-muted-foreground",
                    (isEqual(day, selectedDay) || isToday(day)) &&
                    "font-semibold",
                    "flex h-14 flex-col bg-white px-3 py-2 hover:bg-gray-50 transition-colors focus:z-10"
                  )}>
                  <time
                    dateTime={format(day, "yyyy-MM-dd")}
                    className={cn(
                      "ml-auto flex size-6 items-center justify-center rounded-full",
                      isEqual(day, selectedDay) &&
                      isToday(day) &&
                      "bg-primary text-primary-foreground",
                      isEqual(day, selectedDay) &&
                      !isToday(day) &&
                      "bg-primary text-primary-foreground"
                    )}>
                    {format(day, "d")}
                  </time>
                  {data.filter((date) => isSameDay(date.day, day)).length >
                    0 && (
                      <div>
                        {data
                          .filter((date) => isSameDay(date.day, day))
                          .map((date) => (
                            <div
                              key={date.day.toString()}
                              className="-mx-0.5 mt-auto flex flex-wrap-reverse">
                              {date.events.map((event) => (
                                <span
                                  key={event.id}
                                  className="mx-0.5 mt-1 h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                              ))}
                            </div>
                          ))}
                      </div>
                    )}
                </button>
              ) : (
                <div
                  key={dayIdx}
                  onClick={() => setSelectedDay(day)}
                  className={cn(
                    dayIdx === 0 && colStartClasses[getDay(day)],
                    "bg-white relative flex flex-col hover:bg-gray-50/80 transition-colors focus:z-10 min-h-[75px] group",
                    !isEqual(day, selectedDay) && "hover:bg-gray-50"
                  )}>
                  <header className="flex items-center justify-between p-2.5">
                    <button
                      type="button"
                      className={cn(
                        isEqual(day, selectedDay) && "text-primary-foreground",
                        !isEqual(day, selectedDay) &&
                        !isToday(day) &&
                        isSameMonth(day, firstDayCurrentMonth) &&
                        "text-foreground",
                        !isEqual(day, selectedDay) &&
                        !isToday(day) &&
                        !isSameMonth(day, firstDayCurrentMonth) &&
                        "text-muted-foreground",
                        isEqual(day, selectedDay) &&
                        isToday(day) &&
                        "border-none bg-black text-white",
                        isEqual(day, selectedDay) &&
                        !isToday(day) &&
                        "bg-black text-white",
                        (isEqual(day, selectedDay) || isToday(day)) &&
                        "font-black text-[12px]",
                        "flex h-8 w-8 items-center justify-center rounded-2xl text-[10px] font-bold text-gray-400 group-hover:text-black transition-colors"
                      )}>
                      <time dateTime={format(day, "yyyy-MM-dd")}>
                        {format(day, "d")}
                      </time>
                    </button>
                  </header>
                  <div className="flex-1 p-2.5">
                    {data
                      .filter((event) => isSameDay(event.day, day))
                      .map((day) => (
                        <div key={day.day.toString()} className="space-y-1.5">
                          {day.events.slice(0, 2).map((event) => {
                            const isReview = event.tag === 'review';
                            const eventContent = (
                              <div
                                className={`flex flex-col items-start gap-1 rounded-xl border p-2.5 text-[9px] leading-snug transition-colors w-full cursor-pointer hover:shadow-md hover:border-black ${isReview
                                  ? 'bg-blue-50/50 border-blue-100 hover:bg-blue-50'
                                  : 'bg-gray-50 border-gray-200 hover:bg-white'
                                  }`}
                              >
                                <div className="flex items-center justify-between w-full gap-1">
                                  <p className={`font-black uppercase tracking-widest truncate ${isReview ? 'text-blue-900' : 'text-gray-900'}`}>
                                    {event.name}
                                  </p>
                                  {isReview && (
                                    <span className="shrink-0 px-1 py-0.5 bg-blue-100 text-blue-700 rounded text-[7px] font-black uppercase tracking-widest">RVW</span>
                                  )}
                                </div>
                                <p className={`font-bold ${isReview ? 'text-blue-500' : 'text-gray-400'}`}>
                                  {event.time}
                                </p>
                              </div>
                            );

                            return (
                              <Dialog key={event.id}>
                                <DialogTrigger asChild>
                                  <div className="block w-full">
                                    {eventContent}
                                  </div>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md !bg-white rounded-[2rem] p-8 border-none shadow-2xl">
                                  <DialogHeader className="mb-2">
                                    <DialogTitle className="text-2xl font-black uppercase tracking-tighter text-gray-900">
                                      Meeting Details
                                    </DialogTitle>
                                    <DialogDescription className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                      {format(day.day, "EEEE, MMMM d, yyyy")}
                                    </DialogDescription>
                                  </DialogHeader>

                                  <div className="space-y-6 pt-4">
                                    <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                      <Clock className="w-5 h-5 text-gray-400" />
                                      <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Scheduled Time (24H)</p>
                                        <p className="text-sm font-bold text-gray-900">
                                          {event.time ? format(parse(event.time, 'HH:mm', new Date()), 'HH:mm') + ' Hrs' : 'TBD'}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="flex flex-col gap-3">
                                      <div className="flex items-start gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                                        <AlignLeft className="w-5 h-5 text-gray-400 mt-0.5" />
                                        <div className="space-y-1">
                                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Target / Host</p>
                                          <p className="text-sm font-bold text-gray-900 leading-relaxed truncate">
                                            {event.name || 'Unknown'}
                                          </p>
                                        </div>
                                      </div>

                                      {event.description && (
                                        <div className="flex items-start gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                                          <AlignLeft className="w-5 h-5 text-gray-400 mt-0.5" />
                                          <div className="space-y-1">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Agenda / Context</p>
                                            <p className="text-sm font-bold text-gray-700 leading-relaxed break-all">
                                              {event.description}
                                            </p>
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    {event.status === 'Scheduled' || event.tag === 'meeting' ? (
                                      <div className="flex items-center gap-3">
                                        {event.tag === 'review' && (
                                          <>
                                            <button
                                              onClick={() => onEventAction?.('attended', event)}
                                              className="flex-1 inline-flex justify-center items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-3.5 rounded-xl border border-emerald-100 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100/80 transition-all hover:scale-[1.02] active:scale-95 shadow-sm"
                                            >
                                              <CheckCircle2 className="w-4 h-4" /> Attended
                                            </button>
                                            <button
                                              onClick={() => onEventAction?.('missed', event)}
                                              className="flex-1 inline-flex justify-center items-center gap-2 bg-red-50 text-red-700 px-4 py-3.5 rounded-xl border border-red-100 text-[10px] font-black uppercase tracking-widest hover:bg-red-100/80 transition-all hover:scale-[1.02] active:scale-95 shadow-sm"
                                            >
                                              <AlertTriangle className="w-4 h-4" /> Missed
                                            </button>
                                          </>
                                        )}
                                        <button
                                          onClick={() => onEventAction?.('postpone_request', event)}
                                          className={`inline-flex justify-center items-center bg-gray-50 text-gray-700 ${event.tag === 'meeting' ? 'flex-1 h-[42px]' : 'w-12 h-[42px]'} rounded-xl border border-gray-200 hover:bg-gray-100 transition-all hover:scale-[1.02] active:scale-95 shadow-sm`}
                                          aria-label="Edit / Postpone"
                                          title="Edit / Postpone"
                                        >
                                          <CalendarIcon className="w-4 h-4" />
                                          {event.tag === 'meeting' && <span className="ml-2 text-[10px] font-black uppercase tracking-widest">Edit / Reschedule</span>}
                                        </button>
                                      </div>
                                    ) : null}

                                    {event.meetingLink && (
                                      <a
                                        href={event.meetingLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full inline-flex justify-center items-center gap-2 bg-black text-white px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-transform hover:scale-[1.02] active:scale-95 shadow-xl hover:shadow-2xl"
                                      >
                                        <ExternalLink className="w-4 h-4" />
                                        Launch Communication
                                      </a>
                                    )}
                                  </div>
                                </DialogContent>
                              </Dialog>
                            );
                          })}
                          {day.events.length > 1 && (
                            <div className="text-xs text-muted-foreground">
                              + {day.events.length - 1} more
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              ))}
          </div>

          <div
            className="isolate grid w-full grid-cols-7 grid-rows-5 gap-[1px] lg:hidden">
            {days.map((day, dayIdx) => (
              <button
                onClick={() => setSelectedDay(day)}
                key={dayIdx}
                type="button"
                className={cn(
                  isEqual(day, selectedDay) && "text-primary-foreground",
                  !isEqual(day, selectedDay) &&
                  !isToday(day) &&
                  isSameMonth(day, firstDayCurrentMonth) &&
                  "text-foreground",
                  !isEqual(day, selectedDay) &&
                  !isToday(day) &&
                  !isSameMonth(day, firstDayCurrentMonth) &&
                  "text-muted-foreground",
                  (isEqual(day, selectedDay) || isToday(day)) &&
                  "font-semibold",
                  "flex h-14 flex-col bg-white px-3 py-2 hover:bg-gray-50 focus:z-10"
                )}>
                <time
                  dateTime={format(day, "yyyy-MM-dd")}
                  className={cn(
                    "ml-auto flex size-6 items-center justify-center rounded-full",
                    isEqual(day, selectedDay) &&
                    isToday(day) &&
                    "bg-primary text-primary-foreground",
                    isEqual(day, selectedDay) &&
                    !isToday(day) &&
                    "bg-primary text-primary-foreground"
                  )}>
                  {format(day, "d")}
                </time>
                {data.filter((date) => isSameDay(date.day, day)).length > 0 && (
                  <div>
                    {data
                      .filter((date) => isSameDay(date.day, day))
                      .map((date) => (
                        <div
                          key={date.day.toString()}
                          className="-mx-0.5 mt-auto flex flex-wrap-reverse">
                          {date.events.map((event) => (
                            <span
                              key={event.id}
                              className="mx-0.5 mt-1 h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                          ))}
                        </div>
                      ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
