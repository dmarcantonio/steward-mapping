import Papa from 'papaparse'
import geocodeCsv from '../../csv/address_geocode.csv?raw'
import ministryCsv from '../../csv/total_members_by_ministry.csv?raw'
import worksiteCsv from '../../csv/total_members_by_worksite.csv?raw'
import type { Counts, Dataset, MinistryRow, Worksite } from '../types'

type Row = Record<string, string>

// Delimiter is auto-detected, so the tab-separated "ministry" file parses too.
// Headers are lower-cased so "Total members" / "Total Members" both match.
const parseCsv = (raw: string): Row[] =>
  Papa.parse<Row>(raw, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.replace(/^\uFEFF/, '').trim().toLowerCase(),
    transform: (v) => v.trim(),
  }).data

export const addressKey = (s: string): string =>
  s.trim().toLowerCase().replace(/\s+/g, ' ')

const toInt = (v: string | undefined): number => {
  const n = parseInt((v ?? '').replace(/,/g, ''), 10)
  return Number.isFinite(n) ? n : 0
}

const orNull = (v: string | undefined): string | null => (v ? v : null)

const toCounts = (r: Row): Counts => ({
  members: toInt(r['total members']),
  stewards: toInt(r['total stewards']),
  ohsReps: toInt(r['total ohs representatives'] ?? r['total ohs reps']),
})

export function buildDataset(): Dataset {
  const displayAddress = new Map<string, string>()
  const remember = (id: string, address: string) => {
    if (!displayAddress.has(id)) displayAddress.set(id, address)
  }

  // address_geocode.csv -> lookup by work_location_addr (first match wins)
  const geo = new Map<string, Row>()
  for (const r of parseCsv(geocodeCsv)) {
    const id = addressKey(r['work_location_addr'] ?? '')
    if (id && !geo.has(id)) geo.set(id, r)
  }

  // total_members_by_worksite.csv -> one totals record per address
  const totals = new Map<string, Counts>()
  for (const r of parseCsv(worksiteCsv)) {
    const address = r['work location address'] ?? ''
    const id = addressKey(address)
    if (!id) continue
    totals.set(id, toCounts(r))
    remember(id, address)
  }

  // total_members_by_ministry.csv -> many ministry rows per address
  const ministries = new Map<string, MinistryRow[]>()
  for (const r of parseCsv(ministryCsv)) {
    const address = r['work location address'] ?? ''
    const id = addressKey(address)
    if (!id) continue
    const rows = ministries.get(id) ?? []
    rows.push({ ministry: r['employer/ministry name'] ?? '', ...toCounts(r) })
    ministries.set(id, rows)
    remember(id, address)
  }

  const worksites: Worksite[] = []
  const unmapped: string[] = []

  for (const [id, address] of displayAddress) {
    const g = geo.get(id)
    const lat = g ? parseFloat(g['y']) : NaN // Y = latitude
    const lng = g ? parseFloat(g['x']) : NaN // X = longitude
    if (!g || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      unmapped.push(address)
      continue
    }
    worksites.push({
      id,
      address,
      city: orNull(g['work_location_city']),
      postal: orNull(g['work_location_postal']),
      fullAddress: orNull(g['fulladdress']),
      lat,
      lng,
      chsaCode: orNull(g['chsacode']),
      chsaName: orNull(g['chsaname']),
      totals: totals.get(id) ?? null,
      ministries: ministries.get(id) ?? [],
    })
  }

  return { worksites, unmapped }
}
