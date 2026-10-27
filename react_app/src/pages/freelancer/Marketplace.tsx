import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { api } from '@/lib/api'
import { ROUTES } from '@/constants'
import { formatCurrency } from '@/lib/utils'
import { AgGridReact } from 'ag-grid-react'
import { ModuleRegistry, AllCommunityModule, themeQuartz, colorSchemeDark } from 'ag-grid-community'
import type { ColDef, ICellRendererParams } from 'ag-grid-community'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search } from 'lucide-react'

ModuleRegistry.registerModules([AllCommunityModule])

const darkTheme = themeQuartz.withPart(colorSchemeDark).withParams({
  backgroundColor: '#0E1528',
  foregroundColor: '#F8FAFC',
  headerBackgroundColor: '#090E1A',
  headerTextColor: '#94A3B8',
  borderColor: '#222A3D',
  rowHoverColor: '#172036',
  fontFamily: "'Lexend', sans-serif",
  fontSize: 12,
})

export const Marketplace: React.FC = () => {
  const navigate = useNavigate()
  const [listings, setListings] = useState<any[]>([])
  const [skill, setSkill] = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.listings.list({
        skill: skill || undefined,
        category: category || undefined,
        per_page: 50,
      })
      setListings(res.listings || [])
    } catch {
      setListings([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const columnDefs = useMemo<ColDef[]>(
    () => [
      { headerName: 'Code', field: 'code', width: 130 },
      { headerName: 'Title', field: 'title', flex: 1, minWidth: 180 },
      { headerName: 'Category', field: 'category', width: 120 },
      {
        headerName: 'Budget',
        field: 'total_amount',
        width: 120,
        cellRenderer: (p: ICellRendererParams) => formatCurrency(Number(p.value) || 0),
      },
      { headerName: 'Skills', field: 'required_skills', flex: 1, valueFormatter: (p) => (p.value || []).join(', ') },
    ],
    []
  )

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">Open contracts</h1>
          <p className="text-xs text-slate-400 mt-1">Browse work, then apply with a cover note and portfolio.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="Skill or keyword"
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
            className="bg-[#0B1326] border-[#2D3449] text-white text-xs"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-9 rounded-md bg-[#0B1326] border border-[#2D3449] text-xs text-slate-200 px-2"
          >
            <option value="">All categories</option>
            <option value="software">Software</option>
            <option value="design">Design</option>
            <option value="marketing">Marketing</option>
            <option value="research">Research</option>
          </select>
          <Button size="sm" onClick={() => void load()} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1">
            <Search className="w-3.5 h-3.5" /> Search
          </Button>
        </div>
        {loading ? <p className="text-sm text-slate-400">Loading listings…</p> : null}
        <div className="hidden md:block h-[480px] rounded-xl overflow-hidden border border-[#222A3D]">
          <AgGridReact
            theme={darkTheme}
            rowData={listings}
            columnDefs={columnDefs}
            defaultColDef={{ sortable: true, filter: true, resizable: true }}
            onRowClicked={(e) => e.data?.id && navigate(ROUTES.LISTING_DETAIL(e.data.id))}
          />
        </div>
        <div className="md:hidden space-y-3">
          {listings.map((l) => (
            <Card
              key={l.id}
              className="border-[#222A3D] bg-[#131B2E] text-white cursor-pointer"
              onClick={() => navigate(ROUTES.LISTING_DETAIL(l.id))}
            >
              <CardContent className="py-4 space-y-1">
                <p className="text-[11px] font-mono text-emerald-400">{l.code}</p>
                <p className="font-semibold text-sm">{l.title}</p>
                <p className="text-xs text-slate-400 line-clamp-2">{l.description}</p>
                <p className="text-xs font-mono">{formatCurrency(Number(l.total_amount) || 0)} · {l.category}</p>
              </CardContent>
            </Card>
          ))}
          {!loading && listings.length === 0 && (
            <p className="text-xs text-slate-400">No open contracts match these filters.</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default Marketplace
