"use client"

interface RawDataTableProps {
  data: Record<string, number | string | null>[]
}

export default function RawDataTable({ data }: RawDataTableProps) {
  if (!data.length) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-zinc-500">
        No raw data available.
      </div>
    )
  }

  const columns = Object.keys(data[0])

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-zinc-950">
            <tr className="text-left text-zinc-400">
              {columns.map((column) => (
                <th key={column} className="px-4 py-3 font-medium">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={rowIndex % 2 === 0 ? "bg-zinc-900" : "bg-zinc-950"}
              >
                {columns.map((column) => (
                  <td key={`${rowIndex}-${column}`} className="px-4 py-3 text-zinc-300">
                    {row[column] === null ? "—" : String(row[column])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}