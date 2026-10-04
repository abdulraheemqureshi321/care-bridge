const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');
const Hospital = require('../models/Hospital');
const Consultant = require('../models/Consultant');
const Laboratory = require('../models/Laboratory');
const HospitalDoctor = require('../models/HospitalDoctor');
const Referral = require('../models/Referral');
const LabReferral = require('../models/LabReferral');
const { ensurePlatformData } = require('../bootstrap/ensurePlatformData');

const ALLOWED_WARDS = ['General', 'Private', 'ICU', 'NICU', 'PICU', 'HDU', 'Burns', 'Maternity', 'Psychiatric', 'Cardiac'];

const seedBeds = () => {
  return ALLOWED_WARDS.map((w) => ({
    ward: w,
    totalBeds: 25,
    occupiedBeds: 5,
    availableBeds: 20,
  }));
};

async function seed() {
  try {
    const mongoUri = process.env.MONGO_URI;
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri, { family: 4 });
    console.log('Connected to MongoDB Atlas.');

    // Ensure system platform data exists
    await ensurePlatformData();

    const commonPassword = 'Password123!';
    const passwordHash = await bcrypt.hash(commonPassword, 12);

    console.log('\n--- Seeding / Updating Test Accounts ---');

    // 1. ADMIN ACCOUNT
    const adminEmail = 'admin@carebridge.local';
    let adminUser = await User.findOne({ email: adminEmail });
    if (!adminUser) {
      adminUser = await User.create({
        name: 'Super Admin',
        email: adminEmail,
        phone: '+923000000000',
        passwordHash,
        role: 'admin',
        status: 'active',
        isEmailVerified: true,
        isPhoneVerified: true,
      });
      console.log(`Created Admin: ${adminEmail}`);
    } else {
      adminUser.passwordHash = passwordHash;
      adminUser.status = 'active';
      adminUser.isEmailVerified = true;
      adminUser.isPhoneVerified = true;
      adminUser.role = 'admin';
      await adminUser.save();
      console.log(`Updated Admin password & flags: ${adminEmail}`);
    }

    // 2. CONSULTANT ACCOUNT
    const doctorEmail = 'doctor@carebridge.local';
    let consultantUser = await User.findOne({ email: doctorEmail });
    if (!consultantUser) {
      consultantUser = await User.create({
        name: 'Dr. Sarah Ahmed',
        email: doctorEmail,
        phone: '+923001234567',
        passwordHash,
        role: 'consultant',
        status: 'active',
        isEmailVerified: true,
        isPhoneVerified: true,
      });
      console.log(`Created Consultant User: ${doctorEmail}`);
    } else {
      consultantUser.passwordHash = passwordHash;
      consultantUser.status = 'active';
      consultantUser.isEmailVerified = true;
      consultantUser.isPhoneVerified = true;
      consultantUser.role = 'consultant';
      await consultantUser.save();
      console.log(`Updated Consultant User: ${doctorEmail}`);
    }

    let consultantDoc = await Consultant.findOne({ userId: consultantUser._id });
    if (!consultantDoc) {
      consultantDoc = await Consultant.create({
        userId: consultantUser._id,
        pmdcNumber: '54321-S',
        cnic: '42101-1234567-9',
        specialty: 'Internal Medicine',
        clinicName: 'Care First Medical Center',
        clinicAddress: 'Suite 201, Medical Towers, Karachi',
        isVerified: true,
        commissionPercentage: 60,
      });
      console.log('Created Consultant Profile for Dr. Sarah Ahmed');
    } else {
      consultantDoc.isVerified = true;
      await consultantDoc.save();
      console.log('Verified Consultant Profile for Dr. Sarah Ahmed');
    }

    // 3. HOSPITAL ACCOUNT
    const hospitalEmail = 'hospital@carebridge.local';
    let hospitalUser = await User.findOne({ email: hospitalEmail });
    if (!hospitalUser) {
      hospitalUser = await User.create({
        name: 'City General Hospital',
        email: hospitalEmail,
        phone: '+923009876543',
        passwordHash,
        role: 'hospital',
        status: 'active',
        isEmailVerified: true,
        isPhoneVerified: true,
      });
      console.log(`Created Hospital User: ${hospitalEmail}`);
    } else {
      hospitalUser.passwordHash = passwordHash;
      hospitalUser.status = 'active';
      hospitalUser.isEmailVerified = true;
      hospitalUser.isPhoneVerified = true;
      hospitalUser.role = 'hospital';
      await hospitalUser.save();
      console.log(`Updated Hospital User: ${hospitalEmail}`);
    }

    let hospitalDoc = await Hospital.findOne({ userId: hospitalUser._id });
    if (!hospitalDoc) {
      hospitalDoc = await Hospital.create({
        userId: hospitalUser._id,
        hospitalName: 'City General Hospital',
        registrationNumber: 'HOSP-KHI-001',
        representativeCnic: '42101-9876543-1',
        address: 'Main University Road, Gulshan-e-Iqbal, Karachi',
        departments: ['Internal Medicine', 'Cardiology', 'Pediatrics', 'General Surgery', 'Orthopedics'],
        location: { type: 'Point', coordinates: [67.0982, 24.9312] },
        bedsInventory: seedBeds(),
        ratePackages: [
          { department: 'Internal Medicine', serviceName: 'General Consultation', minPrice: 150000, maxPrice: 300000 },
          { department: 'Cardiology', serviceName: 'ECG + Consultation', minPrice: 250000, maxPrice: 500000 },
        ],
        isActive: true,
        isRegistrationVerified: true,
        deductionPercentage: 20,
      });
      console.log('Created Hospital Profile for City General Hospital');
    } else {
      hospitalDoc.isActive = true;
      hospitalDoc.isRegistrationVerified = true;
      hospitalDoc.bedsInventory = seedBeds();
      await hospitalDoc.save();
      console.log('Updated Hospital Profile for City General Hospital');
    }

    // Seed doctors for hospital
    const existingDoctors = await HospitalDoctor.countDocuments({ hospitalId: hospitalDoc._id });
    if (existingDoctors === 0) {
      await HospitalDoctor.create([
        {
          name: 'Dr. Tariq Mehmood',
          specialty: 'Internal Medicine',
          pmdcNumber: 'PMDC-DOC-001',
          hospitalId: hospitalDoc._id,
          isAvailable: true,
          consultationFee: 150000,
          phone: '+923001112233',
          email: 'tariq@cityhospital.local',
        },
        {
          name: 'Dr. Ayesha Malik',
          specialty: 'Cardiology',
          pmdcNumber: 'PMDC-DOC-002',
          hospitalId: hospitalDoc._id,
          isAvailable: true,
          consultationFee: 250000,
          phone: '+923002223344',
          email: 'ayesha@cityhospital.local',
        },
      ]);
      console.log('Seeded 2 Hospital Doctors');
    }

    // 4. LABORATORY ACCOUNT
    const labEmail = 'lab@carebridge.local';
    let labUser = await User.findOne({ email: labEmail });
    if (!labUser) {
      labUser = await User.create({
        name: 'CareBridge Diagnostic Lab',
        email: labEmail,
        phone: '+923007654321',
        passwordHash,
        role: 'laboratory',
        status: 'active',
        isEmailVerified: true,
        isPhoneVerified: true,
      });
      console.log(`Created Laboratory User: ${labEmail}`);
    } else {
      labUser.passwordHash = passwordHash;
      labUser.status = 'active';
      labUser.isEmailVerified = true;
      labUser.isPhoneVerified = true;
      labUser.role = 'laboratory';
      await labUser.save();
      console.log(`Updated Laboratory User: ${labEmail}`);
    }

    let labDoc = await Laboratory.findOne({ userId: labUser._id });
    const defaultCatalog = [
      { testName: 'Complete Blood Count (CBC)', price: 80000, turnaroundHours: 12 },
      { testName: 'Lipid Profile', price: 150000, turnaroundHours: 24 },
      { testName: 'HbA1c (Glycated Hemoglobin)', price: 120000, turnaroundHours: 12 },
      { testName: 'Liver Function Test (LFT)', price: 180000, turnaroundHours: 24 },
      { testName: 'Chest X-Ray (PA View)', price: 100000, turnaroundHours: 6 },
      { testName: 'Serum Creatinine & Urea', price: 90000, turnaroundHours: 12 },
    ];

    if (!labDoc) {
      labDoc = await Laboratory.create({
        userId: labUser._id,
        labName: 'CareBridge Diagnostic Lab',
        registrationNumber: 'LAB-KHI-001',
        representativeCnic: '42101-7654321-2',
        address: 'Shahrah-e-Faisal, PECHS Block 6, Karachi',
        city: 'Karachi',
        area: 'PECHS',
        location: { type: 'Point', coordinates: [67.0722, 24.8615] },
        testCatalog: defaultCatalog,
        isActive: true,
        isRegistrationVerified: true,
        deductionPercentage: 20,
      });
      console.log('Created Laboratory Profile for CareBridge Diagnostic Lab');
    } else {
      labDoc.isActive = true;
      labDoc.isRegistrationVerified = true;
      if (!labDoc.testCatalog || labDoc.testCatalog.length === 0) {
        labDoc.testCatalog = defaultCatalog;
      }
      await labDoc.save();
      console.log('Updated Laboratory Profile for CareBridge Diagnostic Lab');
    }

    // 5. SAMPLE REFERRAL (Hospital)
    const existingRef = await Referral.countDocuments({ consultantId: consultantDoc._id });
    if (existingRef === 0) {
      await Referral.create({
        referralCode: 'CB-2026-0001',
        consultantId: consultantDoc._id,
        patientName: 'Kamran Siddiqui',
        age: 45,
        gender: 'male',
        phone: '+923001239876',
        area: 'Gulshan-e-Iqbal',
        urgency: 'urgent',
        symptomsText: 'Chest discomfort radiating to left shoulder and mild shortness of breath on exertion for 2 days.',
        summaryNotes: 'Patient has hypertension and elevated systolic BP. Recommended urgent cardiology evaluation and ECG.',
        department: 'Cardiology',
        targetHospitalId: hospitalDoc._id,
        status: 'pending',
        budgetBracket: '50k-1lac',
      });
      console.log('Created sample hospital referral: CB-2026-0001');
    }

    // 6. SAMPLE REFERRAL (Lab)
    const existingLabRef = await LabReferral.findOne({ referralCode: 'LAB-2026-0001' });
    if (!existingLabRef) {
      await LabReferral.create({
        referralCode: 'LAB-2026-0001',
        consultantId: consultantDoc._id,
        targetLabId: labDoc._id,
        patientName: 'Zainab Bibi',
        age: 38,
        gender: 'female',
        phone: '+923129876543',
        area: 'PECHS Block 6',
        urgency: 'routine',
        recommendedTests: [
          { testName: 'Complete Blood Count (CBC)', note: 'Check hemoglobin' },
          { testName: 'Lipid Profile', note: 'Fasting 12 hours' },
        ],
        symptomsText: 'Chronic fatigue and occasional dizziness.',
        summaryNotes: 'Rule out anemia and dyslipidemia.',
        status: 'pending',
      });
      console.log('Created sample lab referral: LAB-2026-0001');
    } else {
      console.log('Sample lab referral LAB-2026-0001 already exists.');
    }

    console.log('\n=============================================');
    console.log('         DEMO ACCOUNTS READY TO TEST         ');
    console.log('=============================================');
    console.log('Common Password for all test accounts: Password123!\n');
    console.log('1. Super Admin:');
    console.log(`   Email:    ${adminEmail}`);
    console.log(`   Password: ${commonPassword}`);
    console.log('   Portal:   /admin/overview\n');
    console.log('2. Hospital Admin:');
    console.log(`   Email:    ${hospitalEmail}`);
    console.log(`   Password: ${commonPassword}`);
    console.log('   Portal:   /hospital/dashboard\n');
    console.log('3. Consultant (Doctor):');
    console.log(`   Email:    ${doctorEmail}`);
    console.log(`   Password: ${commonPassword}`);
    console.log('   Portal:   /dashboard\n');
    console.log('4. Laboratory Admin:');
    console.log(`   Email:    ${labEmail}`);
    console.log(`   Password: ${commonPassword}`);
    console.log('   Portal:   /lab/dashboard\n');
    console.log('=============================================\n');

    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();
