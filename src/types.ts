export interface Counts {
  members: number
  stewards: number
  ohsReps: number
}

export interface MinistryRow extends Counts {
  ministry: string
}

export interface Worksite {
  id: string // normalised Work Location Address (join key)
  address: string
  city: string | null
  postal: string | null
  fullAddress: string | null
  lat: number
  lng: number
  chsaCode: string | null
  chsaName: string | null
  totals: Counts | null // from total_members_by_worksite.csv
  ministries: MinistryRow[] // from total_members_by_ministry.csv
}

export interface Dataset {
  worksites: Worksite[]
  unmapped: string[] // addresses in the member CSVs with no usable geocode
}
