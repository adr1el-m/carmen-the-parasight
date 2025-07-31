import { getFirestore, collection, query, where, getDocs, doc, getDoc, orderBy, limit } from 'firebase/firestore'

interface Facility {
  uid: string
  name: string
  type: string
  email: string
  phone: string
  address: string
  city: string
  province: string
  postalCode: string
  country: string
  website: string
  specialties: string[]
  services: string[]
  operatingHours: {
    monday: { open: string; close: string; closed: boolean }
    tuesday: { open: string; close: string; closed: boolean }
    wednesday: { open: string; close: string; closed: boolean }
    thursday: { open: string; close: string; closed: boolean }
    friday: { open: string; close: string; closed: boolean }
    saturday: { open: string; close: string; closed: boolean }
    sunday: { open: string; close: string; closed: boolean }
  }
  staff: {
    total: number
    doctors: number
    nurses: number
    supportStaff: number
  }
  capacity: {
    beds: number
    consultationRooms: number
  }
  languages: string[]
  accreditation: string[]
  insuranceAccepted: string[]
  licenseNumber: string
  description: string
  isActive: boolean
  isSearchable: boolean
  createdAt: any
  updatedAt: any
}

interface SearchFilters {
  name?: string
  type?: string
  city?: string
  province?: string
  specialties?: string[]
  services?: string[]
}

class FacilityService {
  private db = getFirestore()

  /**
   * Search for healthcare facilities
   */
  async searchFacilities(filters: SearchFilters = {}): Promise<Facility[]> {
    try {
      let q = query(
        collection(this.db, 'facilities'),
        where('isActive', '==', true),
        where('isSearchable', '==', true)
      )

      // Add filters
      if (filters.name) {
        q = query(q, where('name', '>=', filters.name), where('name', '<=', filters.name + '\uf8ff'))
      }

      if (filters.type) {
        q = query(q, where('type', '==', filters.type))
      }

      if (filters.city) {
        q = query(q, where('city', '==', filters.city))
      }

      if (filters.province) {
        q = query(q, where('province', '==', filters.province))
      }

      // Add ordering and limit
      q = query(q, orderBy('name'), limit(50))

      const querySnapshot = await getDocs(q)
      const facilities: Facility[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data() as Facility
        facilities.push({
          ...data,
          uid: doc.id
        })
      })

      // Filter by specialties and services if provided (client-side filtering for array fields)
      let filteredFacilities = facilities

      if (filters.specialties && filters.specialties.length > 0) {
        filteredFacilities = filteredFacilities.filter(facility =>
          filters.specialties!.some(specialty =>
            facility.specialties.includes(specialty)
          )
        )
      }

      if (filters.services && filters.services.length > 0) {
        filteredFacilities = filteredFacilities.filter(facility =>
          filters.services!.some(service =>
            facility.services.includes(service)
          )
        )
      }

      return filteredFacilities
    } catch (error) {
      console.error('Error searching facilities:', error)
      throw error
    }
  }

  /**
   * Get a specific facility by ID
   */
  async getFacility(facilityId: string): Promise<Facility | null> {
    try {
      const facilityRef = doc(this.db, 'facilities', facilityId)
      const facilitySnap = await getDoc(facilityRef)

      if (facilitySnap.exists()) {
        const data = facilitySnap.data() as Facility
        return {
          ...data,
          uid: facilitySnap.id
        }
      }

      return null
    } catch (error) {
      console.error('Error getting facility:', error)
      throw error
    }
  }

  /**
   * Get all facility types
   */
  async getFacilityTypes(): Promise<string[]> {
    try {
      const q = query(
        collection(this.db, 'facilities'),
        where('isActive', '==', true),
        where('isSearchable', '==', true)
      )

      const querySnapshot = await getDocs(q)
      const types = new Set<string>()

      querySnapshot.forEach((doc) => {
        const data = doc.data() as Facility
        if (data.type) {
          types.add(data.type)
        }
      })

      return Array.from(types).sort()
    } catch (error) {
      console.error('Error getting facility types:', error)
      throw error
    }
  }

  /**
   * Get all cities with facilities
   */
  async getCities(): Promise<string[]> {
    try {
      const q = query(
        collection(this.db, 'facilities'),
        where('isActive', '==', true),
        where('isSearchable', '==', true)
      )

      const querySnapshot = await getDocs(q)
      const cities = new Set<string>()

      querySnapshot.forEach((doc) => {
        const data = doc.data() as Facility
        if (data.city) {
          cities.add(data.city)
        }
      })

      return Array.from(cities).sort()
    } catch (error) {
      console.error('Error getting cities:', error)
      throw error
    }
  }

  /**
   * Get all provinces with facilities
   */
  async getProvinces(): Promise<string[]> {
    try {
      const q = query(
        collection(this.db, 'facilities'),
        where('isActive', '==', true),
        where('isSearchable', '==', true)
      )

      const querySnapshot = await getDocs(q)
      const provinces = new Set<string>()

      querySnapshot.forEach((doc) => {
        const data = doc.data() as Facility
        if (data.province) {
          provinces.add(data.province)
        }
      })

      return Array.from(provinces).sort()
    } catch (error) {
      console.error('Error getting provinces:', error)
      throw error
    }
  }

  /**
   * Get all specialties available across facilities
   */
  async getSpecialties(): Promise<string[]> {
    try {
      const q = query(
        collection(this.db, 'facilities'),
        where('isActive', '==', true),
        where('isSearchable', '==', true)
      )

      const querySnapshot = await getDocs(q)
      const specialties = new Set<string>()

      querySnapshot.forEach((doc) => {
        const data = doc.data() as Facility
        if (data.specialties) {
          data.specialties.forEach(specialty => specialties.add(specialty))
        }
      })

      return Array.from(specialties).sort()
    } catch (error) {
      console.error('Error getting specialties:', error)
      throw error
    }
  }

  /**
   * Get all services available across facilities
   */
  async getServices(): Promise<string[]> {
    try {
      const q = query(
        collection(this.db, 'facilities'),
        where('isActive', '==', true),
        where('isSearchable', '==', true)
      )

      const querySnapshot = await getDocs(q)
      const services = new Set<string>()

      querySnapshot.forEach((doc) => {
        const data = doc.data() as Facility
        if (data.services) {
          data.services.forEach(service => services.add(service))
        }
      })

      return Array.from(services).sort()
    } catch (error) {
      console.error('Error getting services:', error)
      throw error
    }
  }

  /**
   * Get nearby facilities (simplified - just by city for now)
   */
  async getNearbyFacilities(city: string, limit: number = 10): Promise<Facility[]> {
    try {
      const q = query(
        collection(this.db, 'facilities'),
        where('isActive', '==', true),
        where('isSearchable', '==', true),
        where('city', '==', city),
        orderBy('name'),
        limit(limit)
      )

      const querySnapshot = await getDocs(q)
      const facilities: Facility[] = []

      querySnapshot.forEach((doc) => {
        const data = doc.data() as Facility
        facilities.push({
          ...data,
          uid: doc.id
        })
      })

      return facilities
    } catch (error) {
      console.error('Error getting nearby facilities:', error)
      throw error
    }
  }
}

export default new FacilityService()
export type { Facility, SearchFilters } 