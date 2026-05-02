"use client"

interface RawDataTableProps {
  data: Record<string, number | string | null>[]
}

export default function RawDataTable({ data }: RawDataTableProps) {
  if (!data.length) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">
        No processed metrics available for preview.
      </div>
    )
  }

  const columns = Object.keys(data[0])

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-left text-slate-400">
              {columns.map((column) => (
                <th key={column} className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
                  {column.replace('_', ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="transition-colors hover:bg-slate-50/50"
              >
                {columns.map((column) => (
                  <td key={`${rowIndex}-${column}`} className="px-6 py-4 font-medium text-slate-600 whitespace-nowrap">
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