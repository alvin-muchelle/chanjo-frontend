"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

interface CalendarProps {
  className?: string
  showOutsideDays?: boolean
  selected?: Date | null
  onChange?: (date: Date | null) => void
  inline?: boolean
  [key: string]: unknown
}

function Calendar({
  className,
  showOutsideDays = true,
  selected,
  onChange,
  inline = true,
  ...props
}: CalendarProps) {
  return (
    <DatePicker
      selected={selected}
      onChange={onChange}
      inline={inline}
      renderCustomHeader={({
        date,
        decreaseMonth,
        increaseMonth,
        prevMonthButtonDisabled,
        nextMonthButtonDisabled
      }) => (
        <div className={cn("flex justify-center items-center p-2 relative w-full")}>          
          <button
            onClick={decreaseMonth}
            disabled={prevMonthButtonDisabled}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "size-7 bg-transparent p-0 absolute left-2 opacity-50 hover:opacity-100"
            )}
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="text-sm font-medium">
            {date.toLocaleString("default", { month: "long", year: "numeric" })}
          </span>
          <button
            onClick={increaseMonth}
            disabled={nextMonthButtonDisabled}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "size-7 bg-transparent p-0 absolute right-2 opacity-50 hover:opacity-100"
            )}
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      )}
      dayClassName={(date) => {
        const classes = [buttonVariants({ variant: "ghost" }), "size-8 p-0 text-sm"]
        if (!showOutsideDays && date.getMonth() !== new Date().getMonth()) {
          classes.push("invisible")
        }
        // selected, today, disabled styling can be added here based on date and props.selected
        return cn(classes.join(" "))
      }}
      className={cn("p-3", className)}
      {...props}
    />
  )
}

export { Calendar }
