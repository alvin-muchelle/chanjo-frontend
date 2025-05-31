"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, CaptionProps, useNavigation } from "react-day-picker"

import { cn } from "@/lib/utils"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { buttonVariants } from "@/components/ui/button"

// CustomCaption: uses useNavigation.goToMonth instead of onMonthChange
function CustomCaption(props: CaptionProps) {
  const { displayMonth } = props
  const { goToMonth } = useNavigation()

  const [showYearList, setShowYearList] = React.useState(false)

  const displayedYear = displayMonth.getFullYear()
  const displayedMonthIndex = displayMonth.getMonth()

  // Build years: displayedYear - 3 ... displayedYear + 1
  const years = Array.from({ length: 5 }, (_, i) => displayedYear - 3 + i)

  const months = [
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
  ]

  const toggleYearList = () => setShowYearList((v) => !v)

  const selectYear = (year: number) => {
    setShowYearList(false)
    goToMonth(new Date(year, displayedMonthIndex, 1))
  }

  const handleMonthChange = (monthValue: string) => {
    const newMonthIndex = parseInt(monthValue, 10)
    goToMonth(new Date(displayedYear, newMonthIndex, 1))
  }

  return (
    <div className="w-full flex items-center py-1 gap-2">
      {/* Year button */}
      <button
        type="button"
        onClick={toggleYearList}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "px-2 py-1 text-sm"
        )}
      >
        {displayedYear}
      </button>

      {/* Month dropdown (shadcn Select) */}
      <Select
        value={displayedMonthIndex.toString()}
        onValueChange={handleMonthChange}
      >
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="Month" />
        </SelectTrigger>
        <SelectContent>
          {months.map((m, idx) => (
            <SelectItem key={idx} value={idx.toString()}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Year list, horizontal */}
      {showYearList && (
        <div className="flex flex-row bg-background border rounded shadow-md p-1 gap-1">
          {years.map((yr) => (
            <button
              key={yr}
              type="button"
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "text-sm px-2 py-1 rounded",
                yr === displayedYear
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-accent hover:text-accent-foreground"
              )}
              onClick={() => selectYear(yr)}
            >
              {yr}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-2",
        month: "flex flex-col gap-4",
        caption: "w-full",
        nav: "hidden",
        table: "w-full border-collapse space-x-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-range-end)]:rounded-r-md",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            : "[&:has([aria-selected])]:rounded-md"
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "size-8 p-0 font-normal aria-selected:opacity-100"
        ),
        day_range_start:
          "day-range-start aria-selected:bg-primary aria-selected:text-primary-foreground",
        day_range_end:
          "day-range-end aria-selected:bg-primary aria-selected:text-primary-foreground",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground aria-selected:text-muted-foreground",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        Caption: CustomCaption,
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn("size-4", className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn("size-4", className)} {...props} />
        ),
      }}
      {...props}
    />
  )
}

export { Calendar }
