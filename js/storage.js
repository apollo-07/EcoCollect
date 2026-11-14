/**
 * EcoCollect - Central Storage Module (storage.js)
 * Provides centralized localStorage CRUD functions and initializes rich realistic sample data.
 */

const STORAGE_KEYS = {
    USERS: 'ecocollect_users',
    COLLECTORS: 'ecocollect_collectors',
    REQUESTS: 'ecocollect_requests',
    RATINGS: 'ecocollect_ratings',
    NOTIFICATIONS: 'ecocollect_notifications',
    REWARDS: 'ecocollect_rewards',
    RECYCLING_CENTERS: 'ecocollect_recycling_centers',
    CURRENT_USER: 'ecocollect_current_user',
    SYSTEM_SETTINGS: 'ecocollect_settings'
};

// Reusable CRUD Functions
function getData(key, defaultValue = []) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
        console.error(`Error reading ${key} from localStorage:`, e);
        return defaultValue;
    }
}

function saveData(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        // Dispatch custom storage event for in-tab reactive updates
        window.dispatchEvent(new CustomEvent('ecocollect_storage_updated', {
            detail: { key, data }
        }));
        return true;
    } catch (e) {
        console.error(`Error saving ${key} to localStorage:`, e);
        return false;
    }
}

function updateData(key, id, updatedFields) {
    const list = getData(key, []);
    const index = list.findIndex(item => item.id === id);
    if (index !== -1) {
        list[index] = { ...list[index], ...updatedFields, updatedAt: new Date().toISOString() };
        saveData(key, list);
        return list[index];
    }
    return null;
}

function deleteData(key, id) {
    const list = getData(key, []);
    const filtered = list.filter(item => item.id !== id);
    if (filtered.length !== list.length) {
        saveData(key, filtered);
        return true;
    }
    return false;
}

function generateId(prefix = 'EC') {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    return `${prefix}-${year}-${randomNum}`;
}

// Metropolitan Zones definition
const METRO_ZONES = ['North Zone', 'South Zone', 'East Zone', 'West Zone', 'Central Zone'];

// Category points configuration
const CATEGORY_POINTS = {
    'Mobile Phone': 20,
    'Laptop': 50,
    'Desktop': 60,
    'Monitor': 40,
    'Television': 80,
    'Refrigerator': 100,
    'Washing Machine': 90,
    'Printer': 35,
    'Keyboard': 10,
    'Mouse': 10,
    'Battery': 30,
    'Charger': 15,
    'Other': 25
};

// Realistic Seed Data Initializer
function initializeSeedData(forceReset = false) {
    const usersExist = localStorage.getItem(STORAGE_KEYS.USERS);
    if (usersExist && !forceReset) {
        return; // Already initialized
    }

    console.log("Seeding EcoCollect sample data...");

    // 1. SEED USERS (20 realistic users + Demo User)
    const users = [
        {
            id: 'USR-001',
            name: 'Priya Sharma',
            email: 'user@ecocollect.demo',
            password: 'demo123', // In production: Hashed with bcrypt
            role: 'user',
            phone: '+91 98765 43210',
            address: 'Flat 402, Green Acres Apt, Indiranagar',
            city: 'Metro City',
            area: 'Indiranagar',
            zone: 'East Zone',
            pincode: '560038',
            lat: 12.9783,
            lng: 77.6408,
            ecoPoints: 640,
            totalWasteKg: 42.5,
            pickupsCount: 6,
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
            createdAt: '2026-01-10T10:00:00Z'
        },
        {
            id: 'USR-002',
            name: 'Aarav Patel',
            email: 'aarav.patel@example.com',
            password: 'demo123',
            role: 'user',
            phone: '+91 98111 22334',
            address: 'B-12, Palm Grove Enclave, Koramangala 4th Block',
            city: 'Metro City',
            area: 'Koramangala',
            zone: 'South Zone',
            pincode: '560034',
            lat: 12.9352,
            lng: 77.6245,
            ecoPoints: 480,
            totalWasteKg: 28.0,
            pickupsCount: 4,
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
            createdAt: '2026-01-15T11:20:00Z'
        },
        {
            id: 'USR-003',
            name: 'Ananya Iyer',
            email: 'ananya.iyer@example.com',
            password: 'demo123',
            role: 'user',
            phone: '+91 98222 33445',
            address: 'Villa 7, Whispering Meadows, Whitefield',
            city: 'Metro City',
            area: 'Whitefield',
            zone: 'East Zone',
            pincode: '560066',
            lat: 12.9698,
            lng: 77.7499,
            ecoPoints: 920,
            totalWasteKg: 68.5,
            pickupsCount: 8,
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            createdAt: '2026-01-18T09:15:00Z'
        },
        {
            id: 'USR-004',
            name: 'Vikram Malhotra',
            email: 'vikram.m@example.com',
            password: 'demo123',
            role: 'user',
            phone: '+91 98333 44556',
            address: '45, Prestige Towers, MG Road',
            city: 'Metro City',
            area: 'MG Road',
            zone: 'Central Zone',
            pincode: '560001',
            lat: 12.9756,
            lng: 77.6094,
            ecoPoints: 310,
            totalWasteKg: 19.0,
            pickupsCount: 3,
            avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
            createdAt: '2026-02-01T14:30:00Z'
        },
        {
            id: 'USR-005',
            name: 'Sneha Rao',
            email: 'sneha.rao@example.com',
            password: 'demo123',
            role: 'user',
            phone: '+91 98444 55667',
            address: '89, Rosewood Heights, Jayanagar 7th Block',
            city: 'Metro City',
            area: 'Jayanagar',
            zone: 'South Zone',
            pincode: '560070',
            lat: 12.9250,
            lng: 77.5838,
            ecoPoints: 530,
            totalWasteKg: 35.0,
            pickupsCount: 5,
            avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
            createdAt: '2026-02-05T16:00:00Z'
        },
        {
            id: 'USR-006',
            name: 'Rohan Mehra',
            email: 'rohan.m@example.com',
            password: 'demo123',
            role: 'user',
            phone: '+91 98555 66778',
            address: 'C-301, Lakeview Residency, Hebbal',
            city: 'Metro City',
            area: 'Hebbal',
            zone: 'North Zone',
            pincode: '560024',
            lat: 13.0358,
            lng: 77.5970,
            ecoPoints: 210,
            totalWasteKg: 14.2,
            pickupsCount: 2,
            avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
            createdAt: '2026-02-10T10:45:00Z'
        },
        {
            id: 'USR-007',
            name: 'Divya Nair',
            email: 'divya.nair@example.com',
            password: 'demo123',
            role: 'user',
            phone: '+91 98666 77889',
            address: '102, Orchid Springs, Malleshwaram 15th Cross',
            city: 'Metro City',
            area: 'Malleshwaram',
            zone: 'West Zone',
            pincode: '560003',
            lat: 13.0031,
            lng: 77.5643,
            ecoPoints: 400,
            totalWasteKg: 26.5,
            pickupsCount: 4,
            avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
            createdAt: '2026-02-14T13:10:00Z'
        },
        {
            id: 'USR-008',
            name: 'Karthik Subramanian',
            email: 'karthik.s@example.com',
            password: 'demo123',
            role: 'user',
            phone: '+91 98777 88990',
            address: 'Flat 5B, Skyline Manor, Rajajinagar',
            city: 'Metro City',
            area: 'Rajajinagar',
            zone: 'West Zone',
            pincode: '560010',
            lat: 12.9982,
            lng: 77.5530,
            ecoPoints: 750,
            totalWasteKg: 52.0,
            pickupsCount: 7,
            avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150',
            createdAt: '2026-02-18T15:25:00Z'
        },
        {
            id: 'USR-009',
            name: 'Meera Nambiar',
            email: 'meera.n@example.com',
            password: 'demo123',
            role: 'user',
            phone: '+91 98888 99001',
            address: '12, Sunrise Avenue, Banashankari 3rd Stage',
            city: 'Metro City',
            area: 'Banashankari',
            zone: 'South Zone',
            pincode: '560085',
            lat: 12.9255,
            lng: 77.5468,
            ecoPoints: 180,
            totalWasteKg: 11.5,
            pickupsCount: 2,
            avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150',
            createdAt: '2026-02-22T11:00:00Z'
        },
        {
            id: 'USR-010',
            name: 'Arjun Das',
            email: 'arjun.das@example.com',
            password: 'demo123',
            role: 'user',
            phone: '+91 98999 00112',
            address: 'Tower 4-802, Cyber Heights, Electronic City Phase 1',
            city: 'Metro City',
            area: 'Electronic City',
            zone: 'South Zone',
            pincode: '560100',
            lat: 12.8399,
            lng: 77.6770,
            ecoPoints: 1150,
            totalWasteKg: 85.0,
            pickupsCount: 9,
            avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
            createdAt: '2026-03-01T08:30:00Z'
        },
        {
            id: 'USR-011',
            name: 'Tanvi Joshi',
            email: 'tanvi.j@example.com',
            password: 'demo123',
            role: 'user',
            phone: '+91 97111 12233',
            address: '56, Green Glen Layout, Bellandur',
            city: 'Metro City',
            area: 'Bellandur',
            zone: 'East Zone',
            pincode: '560103',
            lat: 12.9298,
            lng: 77.6740,
            ecoPoints: 340,
            totalWasteKg: 22.0,
            pickupsCount: 3,
            avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
            createdAt: '2026-03-05T12:00:00Z'
        },
        {
            id: 'USR-012',
            name: 'Kabir Sen',
            email: 'kabir.sen@example.com',
            password: 'demo123',
            role: 'user',
            phone: '+91 97222 23344',
            address: '22A, Shanti Niketan, Sadashivanagar',
            city: 'Metro City',
            area: 'Sadashivanagar',
            zone: 'North Zone',
            pincode: '560080',
            lat: 13.0068,
            lng: 77.5813,
            ecoPoints: 620,
            totalWasteKg: 45.0,
            pickupsCount: 5,
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
            createdAt: '2026-03-08T14:15:00Z'
        },
        {
            id: 'USR-013',
            name: 'Pooja Hegde',
            email: 'pooja.h@example.com',
            password: 'demo123',
            role: 'user',
            phone: '+91 97333 34455',
            address: '10, Maple Leaf Villas, HSR Layout Sector 2',
            city: 'Metro City',
            area: 'HSR Layout',
            zone: 'South Zone',
            pincode: '560102',
            lat: 12.9116,
            lng: 77.6389,
            ecoPoints: 510,
            totalWasteKg: 34.5,
            pickupsCount: 4,
            avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
            createdAt: '2026-03-12T09:40:00Z'
        },
        {
            id: 'USR-014',
            name: 'Aditya Roy',
            email: 'aditya.roy@example.com',
            password: 'demo123',
            role: 'user',
            phone: '+91 97444 45566',
            address: 'Penthouse 1201, Brigade Gateway, Yeshwanthpur',
            city: 'Metro City',
            area: 'Yeshwanthpur',
            zone: 'West Zone',
            pincode: '560022',
            lat: 13.0182,
            lng: 77.5554,
            ecoPoints: 890,
            totalWasteKg: 62.0,
            pickupsCount: 7,
            avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
            createdAt: '2026-03-15T15:50:00Z'
        },
        {
            id: 'USR-015',
            name: 'Ritu Verma',
            email: 'ritu.v@example.com',
            password: 'demo123',
            role: 'user',
            phone: '+91 97555 56677',
            address: '74, Silver Spring, Marathahalli Outer Ring Rd',
            city: 'Metro City',
            area: 'Marathahalli',
            zone: 'East Zone',
            pincode: '560037',
            lat: 12.9569,
            lng: 77.7011,
            ecoPoints: 290,
            totalWasteKg: 18.0,
            pickupsCount: 3,
            avatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150',
            createdAt: '2026-03-18T10:10:00Z'
        },
        {
            id: 'USR-016',
            name: 'Manoj Kumar',
            email: 'manoj.k@example.com',
            password: 'demo123',
            role: 'user',
            phone: '+91 97666 67788',
            address: '33, Cunningham Crescent, Vasanth Nagar',
            city: 'Metro City',
            area: 'Vasanth Nagar',
            zone: 'Central Zone',
            pincode: '560052',
            lat: 12.9901,
            lng: 77.5925,
            ecoPoints: 440,
            totalWasteKg: 31.0,
            pickupsCount: 4,
            avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
            createdAt: '2026-03-21T11:45:00Z'
        },
        {
            id: 'USR-017',
            name: 'Deepa Krishnan',
            email: 'deepa.k@example.com',
            password: 'demo123',
            role: 'user',
            phone: '+91 97777 78899',
            address: '15, Lotus Boulevard, Basavanagudi',
            city: 'Metro City',
            area: 'Basavanagudi',
            zone: 'South Zone',
            pincode: '560004',
            lat: 12.9416,
            lng: 77.5753,
            ecoPoints: 720,
            totalWasteKg: 49.0,
            pickupsCount: 6,
            avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150',
            createdAt: '2026-03-25T14:00:00Z'
        },
        {
            id: 'USR-018',
            name: 'Sameer Khan',
            email: 'sameer.k@example.com',
            password: 'demo123',
            role: 'user',
            phone: '+91 97888 89900',
            address: '28, Richmond Park, Richmond Town',
            city: 'Metro City',
            area: 'Richmond Town',
            zone: 'Central Zone',
            pincode: '560025',
            lat: 12.9667,
            lng: 77.6080,
            ecoPoints: 370,
            totalWasteKg: 24.5,
            pickupsCount: 3,
            avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150',
            createdAt: '2026-03-28T16:20:00Z'
        },
        {
            id: 'USR-019',
            name: 'Kavita Pillai',
            email: 'kavita.p@example.com',
            password: 'demo123',
            role: 'user',
            phone: '+91 97999 90011',
            address: 'B-404, Alpine Eco, Doddanekkundi',
            city: 'Metro City',
            area: 'Doddanekkundi',
            zone: 'East Zone',
            pincode: '560037',
            lat: 12.9712,
            lng: 77.6974,
            ecoPoints: 580,
            totalWasteKg: 39.0,
            pickupsCount: 5,
            avatar: 'https://images.unsplash.com/photo-1548142813-c348350df52b?w=150',
            createdAt: '2026-04-01T10:00:00Z'
        },
        {
            id: 'USR-020',
            name: 'Gaurav Singhal',
            email: 'gaurav.s@example.com',
            password: 'demo123',
            role: 'user',
            phone: '+91 96111 23456',
            address: '67, Sahakar Nagar Main Rd, Hebbal North',
            city: 'Metro City',
            area: 'Sahakar Nagar',
            zone: 'North Zone',
            pincode: '560092',
            lat: 13.0617,
            lng: 77.5913,
            ecoPoints: 230,
            totalWasteKg: 15.5,
            pickupsCount: 2,
            avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
            createdAt: '2026-04-05T13:30:00Z'
        },
        {
            id: 'USR-ADMIN',
            name: 'Metropolitan Admin',
            email: 'admin@ecocollect.demo',
            password: 'demo123',
            role: 'admin',
            phone: '+91 80 2299 8800',
            address: 'EcoCollect Metropolitan Operations HQ, Level 8, Green Tech Park',
            city: 'Metro City',
            area: 'Central Business District',
            zone: 'Central Zone',
            pincode: '560001',
            lat: 12.9716,
            lng: 77.5946,
            ecoPoints: 0,
            totalWasteKg: 0,
            pickupsCount: 0,
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            createdAt: '2026-01-01T00:00:00Z'
        }
    ];

    // 2. SEED COLLECTORS (10 certified collection agents)
    const collectors = [
        {
            id: 'COL-001',
            name: 'Rajesh Kumar',
            email: 'collector@ecocollect.demo',
            password: 'demo123',
            role: 'collector',
            phone: '+91 98450 11223',
            status: 'AVAILABLE', // AVAILABLE, BUSY, OFFLINE
            rating: 4.88,
            ratingsCount: 42,
            completedPickups: 42,
            activeRequestsCount: 1,
            maxWorkload: 5,
            vehicle: 'Electric Van (DL-04-EV-2104)',
            vehicleType: 'EV Van (Capacity: 800 kg)',
            zone: 'South Zone',
            lat: 12.9350,
            lng: 77.6150,
            supportedCategories: [
                'Mobile Phone', 'Laptop', 'Desktop', 'Monitor', 'Television',
                'Refrigerator', 'Washing Machine', 'Printer', 'Keyboard', 'Mouse',
                'Battery', 'Charger', 'Other'
            ],
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
            joinedDate: '2025-11-10',
            avgResponseMinutes: 18,
            totalKgCollected: 642.5
        },
        {
            id: 'COL-002',
            name: 'Suresh Babu',
            email: 'suresh.collector@example.com',
            password: 'demo123',
            role: 'collector',
            phone: '+91 98450 22334',
            status: 'AVAILABLE',
            rating: 4.75,
            ratingsCount: 38,
            completedPickups: 39,
            activeRequestsCount: 2,
            maxWorkload: 5,
            vehicle: 'Tata Ace EV (KA-03-E-8821)',
            vehicleType: 'Mini Truck (Capacity: 1000 kg)',
            zone: 'East Zone',
            lat: 12.9750,
            lng: 77.6500,
            supportedCategories: [
                'Mobile Phone', 'Laptop', 'Desktop', 'Monitor', 'Television',
                'Printer', 'Battery', 'Charger', 'Keyboard', 'Mouse'
            ],
            avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
            joinedDate: '2025-11-20',
            avgResponseMinutes: 22,
            totalKgCollected: 580.0
        },
        {
            id: 'COL-003',
            name: 'Manish Verma',
            email: 'manish.v@example.com',
            password: 'demo123',
            role: 'collector',
            phone: '+91 98450 33445',
            status: 'BUSY',
            rating: 4.92,
            ratingsCount: 51,
            completedPickups: 53,
            activeRequestsCount: 3,
            maxWorkload: 4,
            vehicle: 'Mahindra Zor Grand EV (KA-01-EQ-9012)',
            vehicleType: 'EV 3-Wheeler (Capacity: 500 kg)',
            zone: 'Central Zone',
            lat: 12.9710,
            lng: 77.5990,
            supportedCategories: [
                'Mobile Phone', 'Laptop', 'Desktop', 'Monitor', 'Printer',
                'Keyboard', 'Mouse', 'Battery', 'Charger', 'Other'
            ],
            avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150',
            joinedDate: '2025-10-15',
            avgResponseMinutes: 15,
            totalKgCollected: 790.0
        },
        {
            id: 'COL-004',
            name: 'Pradeep Gowda',
            email: 'pradeep.g@example.com',
            password: 'demo123',
            role: 'collector',
            phone: '+91 98450 44556',
            status: 'AVAILABLE',
            rating: 4.65,
            ratingsCount: 29,
            completedPickups: 31,
            activeRequestsCount: 0,
            maxWorkload: 5,
            vehicle: 'Piaggio Ape E-Xtra (KA-04-EV-5544)',
            vehicleType: 'EV Cargo (Capacity: 450 kg)',
            zone: 'West Zone',
            lat: 12.9990,
            lng: 77.5600,
            supportedCategories: [
                'Mobile Phone', 'Laptop', 'Desktop', 'Television', 'Monitor',
                'Refrigerator', 'Washing Machine', 'Battery'
            ],
            avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150',
            joinedDate: '2025-12-01',
            avgResponseMinutes: 24,
            totalKgCollected: 495.0
        },
        {
            id: 'COL-005',
            name: 'Arvind Swamy',
            email: 'arvind.s@example.com',
            password: 'demo123',
            role: 'collector',
            phone: '+91 98450 55667',
            status: 'AVAILABLE',
            rating: 4.81,
            ratingsCount: 35,
            completedPickups: 36,
            activeRequestsCount: 1,
            maxWorkload: 5,
            vehicle: 'Ashok Leyland Bada Dost EV (KA-50-E-1200)',
            vehicleType: 'Heavy EV Truck (Capacity: 1500 kg)',
            zone: 'North Zone',
            lat: 13.0300,
            lng: 77.5900,
            supportedCategories: [
                'Mobile Phone', 'Laptop', 'Desktop', 'Monitor', 'Television',
                'Refrigerator', 'Washing Machine', 'Printer', 'Battery', 'Other'
            ],
            avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
            joinedDate: '2025-11-25',
            avgResponseMinutes: 20,
            totalKgCollected: 610.5
        },
        {
            id: 'COL-006',
            name: 'Kiran Reddy',
            email: 'kiran.r@example.com',
            password: 'demo123',
            role: 'collector',
            phone: '+91 98450 66778',
            status: 'AVAILABLE',
            rating: 4.70,
            ratingsCount: 22,
            completedPickups: 24,
            activeRequestsCount: 1,
            maxWorkload: 4,
            vehicle: 'Euler HiLoad EV (KA-51-EV-3311)',
            vehicleType: 'EV Cargo (Capacity: 688 kg)',
            zone: 'South Zone',
            lat: 12.8900,
            lng: 77.6500,
            supportedCategories: [
                'Mobile Phone', 'Laptop', 'Desktop', 'Monitor', 'Television',
                'Battery', 'Charger', 'Other'
            ],
            avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
            joinedDate: '2026-01-05',
            avgResponseMinutes: 25,
            totalKgCollected: 380.0
        },
        {
            id: 'COL-007',
            name: 'Sunil Chhetri',
            email: 'sunil.c@example.com',
            password: 'demo123',
            role: 'collector',
            phone: '+91 98450 77889',
            status: 'OFFLINE',
            rating: 4.85,
            ratingsCount: 40,
            completedPickups: 41,
            activeRequestsCount: 0,
            maxWorkload: 5,
            vehicle: 'Tata Ultra EV (KA-02-E-9900)',
            vehicleType: 'EV Medium Truck (Capacity: 2000 kg)',
            zone: 'East Zone',
            lat: 12.9600,
            lng: 77.7200,
            supportedCategories: [
                'Mobile Phone', 'Laptop', 'Desktop', 'Monitor', 'Television',
                'Refrigerator', 'Washing Machine', 'Printer', 'Battery', 'Charger', 'Other'
            ],
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
            joinedDate: '2025-10-01',
            avgResponseMinutes: 19,
            totalKgCollected: 720.0
        },
        {
            id: 'COL-008',
            name: 'Dinesh Karthik',
            email: 'dinesh.k@example.com',
            password: 'demo123',
            role: 'collector',
            phone: '+91 98450 88990',
            status: 'AVAILABLE',
            rating: 4.60,
            ratingsCount: 19,
            completedPickups: 20,
            activeRequestsCount: 1,
            maxWorkload: 4,
            vehicle: 'Mahindra Treo Zor (KA-05-EV-4412)',
            vehicleType: 'EV Delivery (Capacity: 550 kg)',
            zone: 'Central Zone',
            lat: 12.9800,
            lng: 77.6100,
            supportedCategories: [
                'Mobile Phone', 'Laptop', 'Printer', 'Keyboard', 'Mouse', 'Battery', 'Charger'
            ],
            avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
            joinedDate: '2026-01-20',
            avgResponseMinutes: 17,
            totalKgCollected: 310.0
        },
        {
            id: 'COL-009',
            name: 'Vijay Shankar',
            email: 'vijay.s@example.com',
            password: 'demo123',
            role: 'collector',
            phone: '+91 98450 99001',
            status: 'AVAILABLE',
            rating: 4.90,
            ratingsCount: 33,
            completedPickups: 35,
            activeRequestsCount: 0,
            maxWorkload: 5,
            vehicle: 'Altigreen neEV (KA-41-E-7722)',
            vehicleType: 'High-Deck EV (Capacity: 700 kg)',
            zone: 'West Zone',
            lat: 13.0100,
            lng: 77.5400,
            supportedCategories: [
                'Mobile Phone', 'Laptop', 'Desktop', 'Monitor', 'Television',
                'Printer', 'Battery', 'Charger', 'Other'
            ],
            avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
            joinedDate: '2025-11-15',
            avgResponseMinutes: 16,
            totalKgCollected: 540.0
        },
        {
            id: 'COL-010',
            name: 'Naveen Kumar',
            email: 'naveen.k@example.com',
            password: 'demo123',
            role: 'collector',
            phone: '+91 98450 00112',
            status: 'BUSY',
            rating: 4.78,
            ratingsCount: 26,
            completedPickups: 28,
            activeRequestsCount: 2,
            maxWorkload: 4,
            vehicle: 'OSM Rage+ EV (KA-53-EV-1920)',
            vehicleType: 'EV Rapid Carrier (Capacity: 500 kg)',
            zone: 'North Zone',
            lat: 13.0500,
            lng: 77.5800,
            supportedCategories: [
                'Mobile Phone', 'Laptop', 'Desktop', 'Monitor', 'Television',
                'Keyboard', 'Mouse', 'Battery', 'Charger'
            ],
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
            joinedDate: '2026-02-01',
            avgResponseMinutes: 21,
            totalKgCollected: 430.0
        }
    ];

    // 3. SEED RECYCLING CENTERS (10 certified R2 & ISO-certified metropolitan e-waste processing hubs)
    const recyclingCenters = [
        {
            id: 'RC-001',
            name: 'EcoGreen Metropolitan Recovery Hub',
            address: 'Plot 44, Peenya Industrial Area Phase 2',
            zone: 'West Zone',
            city: 'Metro City',
            pincode: '560058',
            lat: 13.0285,
            lng: 77.5195,
            distanceKm: 8.5,
            rating: 4.9,
            operatingHours: '08:00 AM – 07:00 PM',
            acceptedCategories: ['Mobile Phone', 'Laptop', 'Desktop', 'Monitor', 'Television', 'Refrigerator', 'Washing Machine', 'Battery', 'Other'],
            certifications: ['R2:2013 Certified', 'ISO 14001', 'CPCB Authorized'],
            contact: '+91 80 2839 1100',
            dailyCapacityKg: 5000,
            materialsProcessed: 'Precious metals (Au, Ag, Cu), Plastics, Rare-earth elements'
        },
        {
            id: 'RC-002',
            name: 'CleanEarth Electronics Smelting & Recycling',
            address: '7B, Electronic City Phase 2 Tech Park Ring Rd',
            zone: 'South Zone',
            city: 'Metro City',
            pincode: '560100',
            lat: 12.8450,
            lng: 77.6850,
            distanceKm: 6.2,
            rating: 4.8,
            operatingHours: '09:00 AM – 06:30 PM',
            acceptedCategories: ['Mobile Phone', 'Laptop', 'Desktop', 'Printer', 'Battery', 'Charger', 'Keyboard', 'Mouse'],
            certifications: ['e-Stewards Certified', 'ISO 9001:2015'],
            contact: '+91 80 2852 4433',
            dailyCapacityKg: 3500,
            materialsProcessed: 'Circuit boards, Lithium-ion batteries, Solder recovery'
        },
        {
            id: 'RC-003',
            name: 'AeroRecycle Circular Metals Facility',
            address: 'Industrial Plot 19, Whitefield Export Promotion Park',
            zone: 'East Zone',
            city: 'Metro City',
            pincode: '560066',
            lat: 12.9820,
            lng: 77.7410,
            distanceKm: 12.0,
            rating: 4.7,
            operatingHours: '08:30 AM – 06:00 PM',
            acceptedCategories: ['Desktop', 'Monitor', 'Television', 'Refrigerator', 'Washing Machine', 'Printer'],
            certifications: ['ISO 14001:2015', 'RoHS Compliance Facility'],
            contact: '+91 80 4123 9988',
            dailyCapacityKg: 6000,
            materialsProcessed: 'Heavy appliances, Compressors, Ferrous & Non-ferrous scrap'
        },
        {
            id: 'RC-004',
            name: 'North Metro Safe-Disposal & Shredding Center',
            address: 'Survey No 88, Bellary Road, Jakkur Aerodrome Area',
            zone: 'North Zone',
            city: 'Metro City',
            pincode: '560064',
            lat: 13.0780,
            lng: 77.6020,
            distanceKm: 11.4,
            rating: 4.85,
            operatingHours: '09:00 AM – 07:00 PM',
            acceptedCategories: ['Mobile Phone', 'Laptop', 'Desktop', 'Battery', 'Charger', 'Other'],
            certifications: ['CPCB Grade-A Recycler', 'Data Destruction Certified DoD 5220.22-M'],
            contact: '+91 80 2362 5511',
            dailyCapacityKg: 4200,
            materialsProcessed: 'Secure Hard Drive shredding, Telecom equipment, LiFePO4 cells'
        },
        {
            id: 'RC-005',
            name: 'Central EcoUrban Materials Recovery',
            address: '14, Goods Shed Road, Near City Railway Yard',
            zone: 'Central Zone',
            city: 'Metro City',
            pincode: '560053',
            lat: 12.9720,
            lng: 77.5740,
            distanceKm: 3.8,
            rating: 4.65,
            operatingHours: '09:00 AM – 06:00 PM',
            acceptedCategories: ['Mobile Phone', 'Laptop', 'Keyboard', 'Mouse', 'Charger', 'Printer'],
            certifications: ['ISO 45001', 'State Pollution Board Tier 1'],
            contact: '+91 80 2287 3344',
            dailyCapacityKg: 2800,
            materialsProcessed: 'Peripheral plastics, Copper wires, Low-temperature solder'
        },
        {
            id: 'RC-006',
            name: 'TerraCycle Hazardous Battery Neutralization Unit',
            address: 'Plot 31, Bommasandra Industrial Area, Hosur Rd',
            zone: 'South Zone',
            city: 'Metro City',
            pincode: '560099',
            lat: 12.8120,
            lng: 77.6910,
            distanceKm: 14.5,
            rating: 4.95,
            operatingHours: '08:00 AM – 08:00 PM',
            acceptedCategories: ['Battery', 'Charger', 'Mobile Phone', 'Laptop', 'Other'],
            certifications: ['Hazardous Waste Handler Tier-1', 'UN 3480 Transport Certified'],
            contact: '+91 80 2783 7722',
            dailyCapacityKg: 4500,
            materialsProcessed: 'Cobalt extraction, Nickel-Manganese-Cobalt, Alkaline battery refining'
        },
        {
            id: 'RC-007',
            name: 'Sunrise Cathode & CRT Safe Disassembly Lab',
            address: '55, Rajajinagar Industrial Suburb 2nd Stage',
            zone: 'West Zone',
            city: 'Metro City',
            pincode: '560010',
            lat: 13.0040,
            lng: 77.5480,
            distanceKm: 7.1,
            rating: 4.7,
            operatingHours: '09:00 AM – 05:30 PM',
            acceptedCategories: ['Television', 'Monitor', 'Desktop', 'Refrigerator'],
            certifications: ['Lead-Glass Processing Authority', 'OSHA 18001'],
            contact: '+91 80 2314 9080',
            dailyCapacityKg: 3800,
            materialsProcessed: 'Lead glass extraction, Phosphor dust capture, High-impact polystyrene'
        },
        {
            id: 'RC-008',
            name: 'Silicon Corridor High-Tech E-Waste Refinery',
            address: 'Block C, ITPL Main Road, Hoodi Industrial Area',
            zone: 'East Zone',
            city: 'Metro City',
            pincode: '560048',
            lat: 12.9920,
            lng: 77.7180,
            distanceKm: 9.8,
            rating: 4.88,
            operatingHours: '08:00 AM – 07:00 PM',
            acceptedCategories: ['Mobile Phone', 'Laptop', 'Desktop', 'Monitor', 'Printer', 'Other'],
            certifications: ['R2v3 Certified', 'Zero Landfill Commitment Verified'],
            contact: '+91 80 4155 7711',
            dailyCapacityKg: 5200,
            materialsProcessed: 'Enterprise server demanufacturing, Gold finger hydrometallurgy'
        },
        {
            id: 'RC-009',
            name: 'GreenShield Appliance Decarbonization Hub',
            address: 'Plot 101, Doddaballapur Apparel & Heavy Green Park',
            zone: 'North Zone',
            city: 'Metro City',
            pincode: '561203',
            lat: 13.1100,
            lng: 77.5750,
            distanceKm: 18.0,
            rating: 4.75,
            operatingHours: '08:00 AM – 06:00 PM',
            acceptedCategories: ['Refrigerator', 'Washing Machine', 'Television', 'Desktop'],
            certifications: ['CFC Gas Reclamation Certified', 'ISO 50001 Energy Management'],
            contact: '+91 80 2762 3399',
            dailyCapacityKg: 7500,
            materialsProcessed: 'Freon/R134a recovery, Heavy motors, Polyurethane foam isolation'
        },
        {
            id: 'RC-010',
            name: 'SwachhCity Civic Urban E-Collection Depot',
            address: 'Civic Amenity Site 4, 100 Feet Rd, Koramangala 1st Block',
            zone: 'South Zone',
            city: 'Metro City',
            pincode: '560034',
            lat: 12.9280,
            lng: 77.6320,
            distanceKm: 2.5,
            rating: 4.82,
            operatingHours: '07:30 AM – 08:30 PM',
            acceptedCategories: ['Mobile Phone', 'Laptop', 'Keyboard', 'Mouse', 'Battery', 'Charger', 'Other'],
            certifications: ['Metropolitan Municipal Council Authorized', 'Citizen Drop-off Certified'],
            contact: '+91 80 2553 1290',
            dailyCapacityKg: 2000,
            materialsProcessed: 'Small electronics triage, sorting, and regional consolidation'
        }
    ];

    // 4. SEED PICKUP REQUESTS (50 realistic requests spanning all statuses)
    // Statuses: REQUESTED, ASSIGNED, ACCEPTED, ON_THE_WAY, ARRIVED, COLLECTED, COMPLETED, CANCELLED
    const categories = [
        'Mobile Phone', 'Laptop', 'Desktop', 'Monitor', 'Television',
        'Refrigerator', 'Washing Machine', 'Printer', 'Keyboard', 'Mouse',
        'Battery', 'Charger', 'Other'
    ];
    const conditions = ['Working', 'Partially Working', 'Not Working', 'Damaged'];
    const timeSlots = [
        '09:00 AM – 12:00 PM',
        '12:00 PM – 03:00 PM',
        '03:00 PM – 06:00 PM',
        '06:00 PM – 08:00 PM'
    ];

    const requests = [];
    const sampleDeviceNames = {
        'Mobile Phone': ['iPhone 11 (64GB)', 'Samsung Galaxy S9', 'Redmi Note 7 Pro', 'OnePlus 6T', 'Nokia 6.1'],
        'Laptop': ['Dell Inspiron 15', 'Lenovo ThinkPad T480', 'HP Pavilion 14', 'MacBook Air 2017', 'Asus VivoBook 15'],
        'Desktop': ['Custom Gaming Rig (Old)', 'Dell OptiPlex 7040', 'HP Pavilion All-in-One', 'Lenovo ThinkCentre'],
        'Monitor': ['Samsung 24" Curved Monitor', 'LG 22" IPS Display', 'Dell UltraSharp 24', 'BenQ 21.5" LCD'],
        'Television': ['Sony Bravia 40" LED', 'Samsung 32" LCD TV', 'LG 43" Smart TV', 'Panasonic Viera 32"'],
        'Refrigerator': ['Whirlpool 190L Single Door', 'LG 260L Double Door Frost Free', 'Godrej 185L Direct Cool'],
        'Washing Machine': ['IFB 6kg Front Load', 'Samsung 6.5kg Top Load', 'LG 7kg Smart Inverter'],
        'Printer': ['HP LaserJet Pro P1108', 'Canon Pixma G2000', 'Epson EcoTank L3110'],
        'Keyboard': ['Logitech K120 USB', 'Dell Multimedia Keyboard', 'Zebronics Mechanical Keybd'],
        'Mouse': ['Logitech Optical Mouse M90', 'HP Wired Mouse', 'Lenovo Wireless Mouse'],
        'Battery': ['UPS Exide 12V Battery', 'Old Laptop Li-ion Packs (3x)', 'Assorted Power Bank Batteries'],
        'Charger': ['Bundle of 6 USB Chargers & Adapters', 'Dell 65W Laptop Adapters', 'Apple MagSafe 1 Chargers'],
        'Other': ['Old Wi-Fi Router + Landline Phone', 'Sony DVD Player & Speakers', 'D-Link 8-port Switch']
    };

    // Helper to generate dates in past 45 days or upcoming 3 days
    const now = new Date();

    // 50 requests definition
    for (let i = 1; i <= 50; i++) {
        const id = `EC-2026-${String(i).padStart(6, '0')}`;
        const user = users[(i - 1) % 20];
        const category = categories[(i * 3 + 1) % categories.length];
        const deviceList = sampleDeviceNames[category];
        const deviceName = deviceList[i % deviceList.length];
        const condition = conditions[(i + 2) % conditions.length];
        const quantity = ((i % 3) + 1);
        const estimatedWeight = parseFloat((quantity * (category === 'Refrigerator' || category === 'Washing Machine' ? 25 : category === 'Television' ? 12 : category === 'Desktop' ? 9 : category === 'Laptop' ? 2.2 : category === 'Mobile Phone' ? 0.35 : 1.5) + (i % 3 * 0.4)).toFixed(1));

        // Determine status distribution
        let status;
        let collector = null;
        let actualWeight = null;
        let dateOffsetDays;
        let timeSlot = timeSlots[i % timeSlots.length];

        if (i === 1) {
            // Active request for demo user (ON_THE_WAY for live tracking demo!)
            status = 'ON_THE_WAY';
            collector = collectors[0]; // Rajesh Kumar
            dateOffsetDays = 0; // Today
        } else if (i === 2) {
            // Live active request in ARRIVED state
            status = 'ARRIVED';
            collector = collectors[1];
            dateOffsetDays = 0;
        } else if (i === 3) {
            // REQUESTED (pending assignment or newly placed)
            status = 'REQUESTED';
            dateOffsetDays = 1;
        } else if (i === 4) {
            // ASSIGNED
            status = 'ASSIGNED';
            collector = collectors[2];
            dateOffsetDays = 1;
        } else if (i === 5) {
            // ACCEPTED
            status = 'ACCEPTED';
            collector = collectors[0];
            dateOffsetDays = 0;
        } else if (i === 6) {
            // COLLECTED
            status = 'COLLECTED';
            collector = collectors[3];
            actualWeight = estimatedWeight;
            dateOffsetDays = -1;
        } else if (i <= 42) {
            // Completed requests
            status = 'COMPLETED';
            collector = collectors[(i) % collectors.length];
            actualWeight = parseFloat((estimatedWeight * (0.95 + (i % 10) * 0.01)).toFixed(1));
            dateOffsetDays = -Math.floor((i - 6) * 1.1) - 1;
        } else if (i <= 46) {
            // Cancelled
            status = 'CANCELLED';
            collector = collectors[(i) % collectors.length];
            dateOffsetDays = -Math.floor(i * 0.8);
        } else {
            // Upcoming REQUESTED / ASSIGNED
            status = (i % 2 === 0) ? 'REQUESTED' : 'ASSIGNED';
            collector = (status === 'ASSIGNED') ? collectors[(i) % collectors.length] : null;
            dateOffsetDays = 2;
        }

        const scheduledDate = new Date(now.getTime() + dateOffsetDays * 86400000).toISOString().split('T')[0];

        const calculatedEcoPoints = Math.round(
            (actualWeight || estimatedWeight) * 10 + (CATEGORY_POINTS[category] || 20)
        );

        requests.push({
            id,
            userId: user.id,
            userName: user.name,
            userPhone: user.phone,
            userEmail: user.email,
            category,
            deviceName,
            quantity,
            estimatedWeight,
            actualWeight,
            condition,
            image: `https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=300`,
            address: user.address,
            city: user.city,
            area: user.area,
            zone: user.zone,
            pincode: user.pincode,
            lat: user.lat + ((i % 5) - 2) * 0.005,
            lng: user.lng + ((i % 7) - 3) * 0.005,
            scheduledDate,
            timeSlot,
            status,
            collectorId: collector ? collector.id : null,
            collectorName: collector ? collector.name : null,
            collectorPhone: collector ? collector.phone : null,
            collectorAvatar: collector ? collector.avatar : null,
            collectorVehicle: collector ? collector.vehicle : null,
            collectorRating: collector ? collector.rating : null,
            ecoPointsEarned: status === 'COMPLETED' ? calculatedEcoPoints : 0,
            potentialPoints: calculatedEcoPoints,
            notes: (i % 4 === 0) ? 'Please call before arriving, building has security check-in.' : 'Devices kept boxed in lobby.',
            collectionProofUrl: status === 'COMPLETED' ? 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=300' : null,
            createdAt: new Date(now.getTime() + (dateOffsetDays - 1) * 86400000).toISOString(),
            completedAt: status === 'COMPLETED' ? new Date(now.getTime() + dateOffsetDays * 86400000).toISOString() : null
        });
    }

    // 5. SEED RATINGS (30 multi-criteria verified reviews)
    const ratings = [];
    const sampleComments = [
        "Collector arrived precisely on time and handled heavy electronics with great care.",
        "Very courteous and professional. Explained the recycling steps clearly.",
        "Smooth experience from booking to doorstep collection. Highly recommended!",
        "Quick and prompt. Digital weighing scale was shown to verify exact weight.",
        "Great initiative for the city! Saved me the hassle of dumping old monitors.",
        "Very polite collector. Safe disposal proof and eco points were credited immediately.",
        "App tracking was spot on, showed the EV van arriving right at my gate.",
        "Professional team. They safely removed our old washing machine without scratches.",
        "Extremely satisfied. Easy scheduling and friendly service.",
        "Punctual, friendly, and verified the hazardous battery cells safely."
    ];

    for (let r = 1; r <= 30; r++) {
        const req = requests[r + 5]; // use completed requests
        const collector = collectors.find(c => c.id === req.collectorId) || collectors[0];
        const overallRating = (r % 7 === 0) ? 4 : 5;
        const punctuality = (r % 5 === 0) ? 4 : 5;
        const professionalism = 5;
        const communication = (r % 6 === 0) ? 4 : 5;
        const processRating = (r % 8 === 0) ? 4 : 5;

        // Two-way rating: Collector rating user
        const userRatingByCollector = {
            readiness: 5,
            communication: (r % 4 === 0) ? 4 : 5,
            cooperation: 5,
            comment: "Customer had all items neatly packed and readily accessible."
        };

        ratings.push({
            id: `RAT-2026-${String(r).padStart(5, '0')}`,
            requestId: req.id,
            userId: req.userId,
            userName: req.userName,
            userAvatar: users.find(u => u.id === req.userId)?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
            collectorId: collector.id,
            collectorName: collector.name,
            overallRating,
            punctuality,
            professionalism,
            communication,
            processRating,
            comment: sampleComments[r % sampleComments.length],
            collectorToUserRating: userRatingByCollector,
            createdAt: req.completedAt || new Date().toISOString()
        });
    }

    // 6. SEED REWARDS CATALOG & REDEMPTION
    const rewards = [
        {
            id: 'REW-001',
            title: '₹50 Green Groceries Coupon',
            partner: 'Nature Basket & BigBasket',
            pointsCost: 500,
            discountValue: '₹50 OFF',
            minSpend: '₹499',
            category: 'Groceries',
            codeTemplate: 'ECO-50-',
            icon: 'fa-shopping-basket',
            badge: 'Popular',
            description: 'Redeem on organic and sustainable grocery orders.'
        },
        {
            id: 'REW-002',
            title: '₹100 Sustainable Apparel Voucher',
            partner: 'EcoKnit & FabIndia',
            pointsCost: 1000,
            discountValue: '₹100 OFF',
            minSpend: '₹899',
            category: 'Lifestyle',
            codeTemplate: 'ECO-100-',
            icon: 'fa-shirt',
            badge: 'Value',
            description: 'Applicable across 100% organic cotton and hemp apparel.'
        },
        {
            id: 'REW-003',
            title: 'EcoCollect Stainless Steel Bottle',
            partner: 'EcoCollect Official Merchandise',
            pointsCost: 1500,
            discountValue: '100% Free Merchandise',
            minSpend: '₹0',
            category: 'Merchandise',
            codeTemplate: 'MERCH-BOTTLE-',
            icon: 'fa-bottle-water',
            badge: 'Featured',
            description: 'Double-walled insulated 750ml vacuum flask with EcoCollect branding.'
        },
        {
            id: 'REW-004',
            title: 'Plant a Memorial Tree in Your Name',
            partner: 'Grow-Trees Foundation Metro Agroforest',
            pointsCost: 800,
            discountValue: 'Tree Plantation + Geo-tagged Certificate',
            minSpend: '₹0',
            category: 'Tree Plantation',
            codeTemplate: 'TREE-GEO-',
            icon: 'fa-tree',
            badge: 'Impact',
            description: 'A native sapling planted in metropolitan green belt with digital certificate.'
        },
        {
            id: 'REW-005',
            title: '₹250 Clean Energy Rides Voucher',
            partner: 'BluSmart EV Cabs',
            pointsCost: 2000,
            discountValue: '₹250 Wallet Credit',
            minSpend: '₹250',
            category: 'Mobility',
            codeTemplate: 'BLU-EV-',
            icon: 'fa-bolt',
            badge: 'High Value',
            description: 'Zero-emission rides across Delhi NCR and Bengaluru.'
        }
    ];

    // Seed sample redemptions for Demo User
    const userRedemptions = [
        {
            id: 'RED-9901',
            rewardId: 'REW-001',
            rewardTitle: '₹50 Green Groceries Coupon',
            pointsSpent: 500,
            couponCode: 'ECO-50-X89K2',
            redeemedAt: '2026-03-20T14:10:00Z',
            status: 'Active',
            expiryDate: '2026-06-20'
        }
    ];
    saveData('ecocollect_user_redemptions', userRedemptions);

    // 7. SEED NOTIFICATIONS
    const notifications = [
        {
            id: 'NOTIF-01',
            userId: 'USR-001',
            role: 'user',
            title: 'Pickup Status: Collector is On The Way',
            message: 'Rajesh Kumar in EV Van (DL-04-EV-2104) is en route to your address. Estimated arrival in 15 mins.',
            type: 'tracking',
            link: '/user/tracking.html?id=EC-2026-000001',
            read: false,
            createdAt: new Date(now.getTime() - 25 * 60000).toISOString()
        },
        {
            id: 'NOTIF-02',
            userId: 'USR-001',
            role: 'user',
            title: 'Eco Points Credited! (+120 Points)',
            message: 'Your previous pickup EC-2026-000007 of Laptop was successfully recycled. You earned 120 Eco Points!',
            type: 'points',
            link: '/user/rewards.html',
            read: true,
            createdAt: new Date(now.getTime() - 2 * 86400000).toISOString()
        },
        {
            id: 'NOTIF-03',
            userId: 'USR-001',
            role: 'user',
            title: 'Rate Your Collection Experience',
            message: 'How did Suresh Babu perform for request EC-2026-000010? Your feedback shapes quality.',
            type: 'rating',
            link: '/user/rating.html?id=EC-2026-000010',
            read: true,
            createdAt: new Date(now.getTime() - 4 * 86400000).toISOString()
        },
        {
            id: 'NOTIF-04',
            userId: 'COL-001',
            role: 'collector',
            title: 'New Pickup Assigned: EC-2026-000001',
            message: 'You have been assigned a pickup at Indiranagar (Priya Sharma). Tap to review navigation.',
            type: 'collector_assigned',
            link: '/collector/pickup.html?id=EC-2026-000001',
            read: false,
            createdAt: new Date(now.getTime() - 45 * 60000).toISOString()
        },
        {
            id: 'NOTIF-05',
            userId: 'USR-ADMIN',
            role: 'admin',
            title: 'High Collection Velocity in South Zone',
            message: 'Over 180 kg e-waste collected in South Zone today. Capacity within optimal operating thresholds.',
            type: 'admin_alert',
            link: '/admin/analytics.html',
            read: false,
            createdAt: new Date(now.getTime() - 60 * 60000).toISOString()
        }
    ];

    // Save everything into localStorage
    saveData(STORAGE_KEYS.USERS, users);
    saveData(STORAGE_KEYS.COLLECTORS, collectors);
    saveData(STORAGE_KEYS.RECYCLING_CENTERS, recyclingCenters);
    saveData(STORAGE_KEYS.REQUESTS, requests);
    saveData(STORAGE_KEYS.RATINGS, ratings);
    saveData(STORAGE_KEYS.REWARDS, rewards);
    saveData(STORAGE_KEYS.NOTIFICATIONS, notifications);

    console.log("EcoCollect sample data seeded successfully!");
}

// Auto-run seed initialization
if (typeof window !== 'undefined') {
    initializeSeedData();
}
