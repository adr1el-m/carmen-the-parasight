/**
 * FACILITY SERVICE
 * This service provides facility data from NeonDB.
 */
import firestoreDb from './database.js';

export interface Facility {
  uid: string;
  name: string;
  type: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  website: string;
  specialties: string[];
  services: string[];
  operatingHours: {
    monday: { open: string; close: string; closed: boolean };
    tuesday: { open: string; close: string; closed: boolean };
    wednesday: { open: string; close: string; closed: boolean };
    thursday: { open: string; close: string; closed: boolean };
    friday: { open: string; close: string; closed: boolean };
    saturday: { open: string; close: string; closed: boolean };
    sunday: { open: string; close: string; closed: boolean };
  };
  staff: {
    totalStaff: number;
    doctors: number;
    nurses: number;
    supportStaff: number;
  };
  capacity: {
    bedCapacity: number;
    consultationRooms: number;
  };
  languages: string[];
  accreditation: string[];
  insuranceAccepted: string[];
  licenseNumber: string;
  description: string;
  isActive: boolean;
  isSearchable: boolean;
  isVerified?: boolean;
  profileComplete?: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface SearchFilters {
  name?: string;
  type?: string;
  city?: string;
  province?: string;
  specialties?: string[];
  services?: string[];
}

class FacilityService {
  /**
   * Search for healthcare facilities
   */
  async searchFacilities(filters: SearchFilters = {}): Promise<Facility[]> {
    try {
      console.log('🔍 Searching facilities with filters:', filters);
      
      // Get facilities from the migrated bridge
      const facilities = await (firestoreDb as any).getFacilities();
      
      // Apply filters client-side
      let filtered = facilities;

      if (filters.name) {
        filtered = filtered.filter((f: any) => 
          f.name.toLowerCase().includes(filters.name!.toLowerCase())
        );
      }

      if (filters.type) {
        filtered = filtered.filter((f: any) => f.type === filters.type);
      }

      if (filters.city) {
        filtered = filtered.filter((f: any) => f.city === filters.city);
      }

      return filtered as Facility[];
    } catch (error) {
      console.error('❌ Error searching facilities:', error);
      return [];
    }
  }

  /**
   * Get a specific facility by ID
   */
  async getFacility(facilityId: string): Promise<Facility | null> {
    try {
      // For now, search within all facilities
      const facilities = await (firestoreDb as any).getFacilities();
      return facilities.find((f: any) => f.uid === facilityId) || null;
    } catch (error) {
      console.error('Error getting facility:', error);
      return null;
    }
  }

  async getFacilityTypes(): Promise<string[]> {
    const facilities = await (firestoreDb as any).getFacilities();
    return Array.from(new Set(facilities.map((f: any) => f.type))).sort() as string[];
  }

  async getCities(): Promise<string[]> {
    const facilities = await (firestoreDb as any).getFacilities();
    return Array.from(new Set(facilities.map((f: any) => f.city))).sort() as string[];
  }

  async getProvinces(): Promise<string[]> {
    const facilities = await (firestoreDb as any).getFacilities();
    return Array.from(new Set(facilities.map((f: any) => f.province))).sort() as string[];
  }

  async getSpecialties(): Promise<string[]> {
    const facilities = await (firestoreDb as any).getFacilities();
    const specialties = new Set<string>();
    facilities.forEach((f: any) => {
      if (f.specialties) f.specialties.forEach((s: string) => specialties.add(s));
    });
    return Array.from(specialties).sort();
  }

  async getServices(): Promise<string[]> {
    const facilities = await (firestoreDb as any).getFacilities();
    const services = new Set<string>();
    facilities.forEach((f: any) => {
      if (f.services) f.services.forEach((s: string) => services.add(s));
    });
    return Array.from(services).sort();
  }

  async getNearbyFacilities(city: string): Promise<Facility[]> {
    return this.searchFacilities({ city });
  }
}

export default new FacilityService();