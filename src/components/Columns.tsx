// src/components/Columns.tsx
import { ColumnDef } from "@tanstack/react-table"
import { FilterIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { formatDateWithOrdinal } from "./CalculateSchedule"

export type Vaccination = {
  age: string
  vaccine: string
  protection_against: string
  date_to_be_administered?: string
}

export const Columns: ColumnDef<Vaccination>[] = [
  {
    accessorKey: "age",
    size: 30,
    minSize: 30,
    maxSize: 100,
    cell: ({ row, table }) => {
      // 1) Guard: if React Table passed an invalid row stub, bail out
      if (!row || !row.original || !table) return null

      const idx = row.index
      const rows = table.getRowModel().rows
      const currentAge = row.original.age
      const prevAge = idx > 0 ? rows[idx - 1]?.original.age : null

      return prevAge === currentAge ? null : <span>{currentAge}</span>
    },
    filterFn: (row, columnId, filterValue: string[]) => {
      // Guard again (although filterFn usually won't be called if no data)
      const original = row.original as Vaccination | undefined
      if (!original) return false
      return filterValue.includes(original.age)
    },
    header: ({ column, table }) => {
      const data = table.getPreFilteredRowModel().rows.map(r => r.original).filter(Boolean) as Vaccination[]
      const uniqueAges = Array.from(new Set(data.map(v => v.age)))
      const selected = (column.getFilterValue() as string[]) ?? []

      const toggleAge = (age: string) => {
        const updated = selected.includes(age)
          ? selected.filter(a => a !== age)
          : [...selected, age]
        column.setFilterValue(updated.length > 0 ? updated : undefined)
      }

      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" className="flex items-center space-x-2">
              <span>Age</span>
              <FilterIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>

          <PopoverContent
            className="w-56 space-y-2 p-4 max-h-72 overflow-y-auto"
            align="start"
            side="bottom"
            sideOffset={8}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => column.setFilterValue(undefined)}
              className="w-full mt-2"
            >
              Clear Filter
            </Button>
            <div className="space-y-1">
              {uniqueAges.map(age => (
                <div key={age} className="flex items-center space-x-2">
                  <Checkbox
                    id={age}
                    checked={selected.includes(age)}
                    onCheckedChange={() => toggleAge(age)}
                  />
                  <label htmlFor={age} className="text-sm">
                    {age}
                  </label>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )
    },
    sortingFn: (rowA, rowB) => {
      // Guard: if rowA.original or rowB.original is missing, we treat them as equal
      const ageA = (rowA.original as Vaccination | undefined)?.age
      const ageB = (rowB.original as Vaccination | undefined)?.age
      if (!ageA || !ageB) return 0

      const orderValue = (age: string): number => {
        if (age.toLowerCase() === "birth") return 0
        const unitWeights: Record<string, number> = {
          week: 1,
          weeks: 1,
          month: 4,
          months: 4,
          year: 52,
          years: 52,
        }
        const rangeRegex = /^(\d+)[–-](\d+)\s*(\w+)/
        const singleRegex = /^(\d+)\s*(\w+)/

        const rangeMatch = age.match(rangeRegex)
        if (rangeMatch) {
          const [, start, end, unit] = rangeMatch
          const startVal = parseInt(start, 10) * (unitWeights[unit.toLowerCase()] || 1000)
          const endVal = parseInt(end, 10) * (unitWeights[unit.toLowerCase()] || 1000)
          return (startVal + endVal) / 2
        }
        const singleMatch = age.match(singleRegex)
        if (singleMatch) {
          const [, num, unit] = singleMatch
          return parseInt(num, 10) * (unitWeights[unit.toLowerCase()] || 1000)
        }
        return 9999
      }

      return orderValue(ageA) - orderValue(ageB)
    }
  },

  {
    accessorKey: "vaccine",
    header: "Vaccine",
    size: 70,
    minSize: 70,
    maxSize: 100,
    cell: ({ row }) => {
      if (!row || !row.original) return null
      return <span>{(row.original as Vaccination).vaccine}</span>
    }
  },

  {
    accessorKey: "protection_against",
    header: "Protection Against",
    minSize: 200,
    cell: ({ row }) => {
      if (!row || !row.original) return null
      const value = (row.original as Vaccination).protection_against
      const items = value.split(", ")
      return items.length > 1 ? (
        <ul className="list-disc list-inside text-left">
          {items.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      ) : (
        <div className="text-left">{value}</div>
      )
    }
  },

  {
    accessorKey: "date_to_be_administered",
    header: "Date to be Administered",
    cell: ({ row }) => {
      if (!row || !row.original) return null
      const rawDate = (row.original as Vaccination).date_to_be_administered ?? ""
      return <span>{formatDateWithOrdinal(rawDate)}</span>
    }
  }
]
