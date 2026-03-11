/**
 * seed.js – Populate the database with sample data for testing.
 *
 * Usage:
 *   node seed.js            → seeds the database
 *   node seed.js --clear    → deletes all data first, then seeds
 *
 * All passwords are: Test@1234
 */
require("dotenv").config();
const mongoose = require("mongoose");

const User = require("./models/User");
const Mechanic = require("./models/Mechanic");
const FuelStation = require("./models/FuelStation");
const MechanicRequest = require("./models/Mechanicrequest");
const FuelRequest = require("./models/Fuelrequest");
const Feedback = require("./models/Feedback");

const PASSWORD = "Test@1234";

async function seed() {
  try {
    const uri =
      process.env.MONGO_URI || "mongodb://localhost:27017/onroad-assistance";
    await mongoose.connect(uri);
    console.log(`✅ Connected to MongoDB: ${uri}`);

    // Optionally clear all collections
    if (process.argv.includes("--clear")) {
      console.log("🗑  Clearing existing data…");
      await Promise.all([
        User.deleteMany({}),
        Mechanic.deleteMany({}),
        FuelStation.deleteMany({}),
        MechanicRequest.deleteMany({}),
        FuelRequest.deleteMany({}),
        Feedback.deleteMany({}),
      ]);
      console.log("   Done.");
    }

    /* ────────────────────────── USERS ────────────────────────── */
    console.log("👤 Creating users…");
    const users = await User.create([
      {
        name: "Aarav Sharma",
        email: "aarav@example.com",
        password: PASSWORD,
        phone: "+919876543001",
        address: "Paltan Bazaar, Guwahati, Assam",
        role: "user",
        isVerified: true,
      },
      {
        name: "Priya Patel",
        email: "priya@example.com",
        password: PASSWORD,
        phone: "+919876543002",
        address: "Fancy Bazaar, Guwahati, Assam",
        role: "user",
        isVerified: true,
      },
      {
        name: "Vikram Reddy",
        email: "vikram@example.com",
        password: PASSWORD,
        phone: "+919876543003",
        address: "Dispur, Guwahati, Assam",
        role: "user",
        isVerified: true,
      },
      {
        name: "Sneha Gupta",
        email: "sneha@example.com",
        password: PASSWORD,
        phone: "+919876543004",
        address: "Beltola, Guwahati, Assam",
        role: "user",
        isVerified: true,
      },
      {
        name: "Rohit Verma",
        email: "rohit@example.com",
        password: PASSWORD,
        phone: "+919876543005",
        address: "Chandmari, Guwahati, Assam",
        role: "user",
        isVerified: true,
      },
      {
        name: "Ananya Singh",
        email: "ananya@example.com",
        password: PASSWORD,
        phone: "+919876543006",
        address: "GS Road, Guwahati, Assam",
        role: "user",
        isVerified: true,
      },
      {
        name: "Admin User",
        email: "admin@onroad.com",
        password: PASSWORD,
        phone: "+919000000000",
        address: "Dispur HQ, Guwahati, Assam",
        role: "admin",
        isVerified: true,
      },
    ]);

    const [aarav, priya, vikram, sneha, rohit, ananya, admin] = users;
    console.log(`   Created ${users.length} users`);

    /* ────────────────────────── MECHANICS ────────────────────── */
    console.log("🔧 Creating mechanics…");
    const mechanics = await Mechanic.create([
      {
        name: "Rajesh Kumar",
        email: "rajesh.mechanic@example.com",
        password: PASSWORD,
        phone: "+919845100001",
        address: "Near Kamakhya Temple, Guwahati, Assam",
        location: { type: "Point", coordinates: [91.7052, 26.1663] },
        servicesOffered: [
          "Engine Repair",
          "Tyre Change",
          "Battery Jump Start",
          "Oil Change",
        ],
        experience: 8,
        licenseNumber: "MECH-AS-001",
        licenseCopy: "license-rajesh.pdf",
        availability: true,
        rating: 4.9,
        totalRatings: 142,
        isApproved: true,
        isVerified: true,
        approvedBy: admin._id,
        approvedAt: new Date("2025-06-15"),
      },
      {
        name: "Suresh Yadav",
        email: "suresh.mechanic@example.com",
        password: PASSWORD,
        phone: "+919845100002",
        address: "Fancy Bazaar, Guwahati, Assam",
        location: { type: "Point", coordinates: [91.745, 26.181] },
        servicesOffered: ["Flat Tyre", "Jump Start", "Towing", "Brake Repair"],
        experience: 5,
        licenseNumber: "MECH-AS-002",
        licenseCopy: "license-suresh.pdf",
        availability: true,
        rating: 4.6,
        totalRatings: 57,
        isApproved: true,
        isVerified: true,
        approvedBy: admin._id,
        approvedAt: new Date("2025-07-20"),
      },
      {
        name: "Manoj Tiwari",
        email: "manoj.mechanic@example.com",
        password: PASSWORD,
        phone: "+919845100003",
        address: "Noonmati, Guwahati, Assam",
        location: { type: "Point", coordinates: [91.75, 26.18] },
        servicesOffered: [
          "Engine Overhaul",
          "Transmission Repair",
          "AC Repair",
          "Electrical",
        ],
        experience: 12,
        licenseNumber: "MECH-AS-003",
        licenseCopy: "license-manoj.pdf",
        availability: true,
        rating: 4.8,
        totalRatings: 98,
        isApproved: true,
        isVerified: true,
        approvedBy: admin._id,
        approvedAt: new Date("2025-05-10"),
      },
      {
        name: "Lakshmi Devi",
        email: "lakshmi.mechanic@example.com",
        password: PASSWORD,
        phone: "+919845100004",
        address: "North Guwahati, Assam",
        location: { type: "Point", coordinates: [91.71, 26.2] },
        servicesOffered: ["General Repair", "Tyre Change", "Battery"],
        experience: 3,
        licenseNumber: "MECH-AS-004",
        licenseCopy: "license-lakshmi.pdf",
        availability: false,
        rating: 4.3,
        totalRatings: 22,
        isApproved: true,
        isVerified: true,
        approvedBy: admin._id,
        approvedAt: new Date("2025-09-01"),
      },
      {
        name: "Deepak Nair",
        email: "deepak.mechanic@example.com",
        password: PASSWORD,
        phone: "+919845100005",
        address: "Basistha, Guwahati, Assam",
        location: { type: "Point", coordinates: [91.768, 26.11] },
        servicesOffered: ["Towing", "Flat Tyre", "Oil Change"],
        experience: 2,
        licenseNumber: "MECH-AS-005",
        licenseCopy: "license-deepak.pdf",
        availability: true,
        rating: 0,
        totalRatings: 0,
        isApproved: false,
        isVerified: false,
      },
      {
        name: "Biren Das",
        email: "biren.mechanic@example.com",
        password: PASSWORD,
        phone: "+919845100006",
        address: "Maligaon, Guwahati, Assam",
        location: { type: "Point", coordinates: [91.715, 26.175] },
        servicesOffered: [
          "Engine Repair",
          "Tyre Change",
          "Battery Jump Start",
          "Suspension",
        ],
        experience: 6,
        licenseNumber: "MECH-AS-006",
        licenseCopy: "license-biren.pdf",
        availability: true,
        rating: 4.5,
        totalRatings: 38,
        isApproved: true,
        isVerified: true,
        approvedBy: admin._id,
        approvedAt: new Date("2025-10-15"),
      },
      {
        name: "Hari Barua",
        email: "hari.mechanic@example.com",
        password: PASSWORD,
        phone: "+919845100007",
        address: "Ganeshguri, Guwahati, Assam",
        location: { type: "Point", coordinates: [91.772, 26.152] },
        servicesOffered: [
          "Flat Tyre",
          "Brake Repair",
          "Oil Change",
          "Electrical",
        ],
        experience: 9,
        licenseNumber: "MECH-AS-007",
        licenseCopy: "license-hari.pdf",
        availability: true,
        rating: 4.7,
        totalRatings: 75,
        isApproved: true,
        isVerified: true,
        approvedBy: admin._id,
        approvedAt: new Date("2025-11-20"),
      },
    ]);

    const [rajesh, suresh, manoj, lakshmi, deepak, biren, hari] = mechanics;
    console.log(
      `   Created ${mechanics.length} mechanics (1 pending approval)`,
    );

    /* ────────────────────────── FUEL STATIONS ────────────────── */
    console.log("⛽ Creating fuel stations…");
    const stations = await FuelStation.create([
      {
        stationName: "Bharat Petroleum - Paltan Bazaar",
        ownerName: "Ramesh Agarwal",
        email: "bharatpetro@example.com",
        password: PASSWORD,
        phone: "+919900200001",
        address: "Paltan Bazaar, Guwahati, Assam",
        location: { type: "Point", coordinates: [91.7362, 26.1445] },
        fuelTypes: [
          { type: "Petrol", price: 102.86, available: true },
          { type: "Diesel", price: 88.94, available: true },
          { type: "CNG", price: 76.59, available: false },
        ],
        licenseNumber: "FUEL-AS-001",
        licenseCopy: "license-bharat.pdf",
        openingHours: "24 Hours",
        deliveryAvailable: true,
        deliveryRadius: 10,
        deliveryCharges: 50,
        minimumOrderQuantity: 5,
        rating: 4.7,
        totalRatings: 89,
        isApproved: true,
        isVerified: true,
        approvedBy: admin._id,
        approvedAt: new Date("2025-06-01"),
      },
      {
        stationName: "Indian Oil - GS Road",
        ownerName: "Meena Iyer",
        email: "indianoil.inr@example.com",
        password: PASSWORD,
        phone: "+919900200002",
        address: "GS Road, Guwahati, Assam",
        location: { type: "Point", coordinates: [91.765, 26.148] },
        fuelTypes: [
          { type: "Petrol", price: 102.86, available: true },
          { type: "Diesel", price: 88.94, available: true },
        ],
        licenseNumber: "FUEL-AS-002",
        licenseCopy: "license-indianoil.pdf",
        openingHours: "6:00 AM - 11:00 PM",
        deliveryAvailable: true,
        deliveryRadius: 8,
        deliveryCharges: 40,
        minimumOrderQuantity: 10,
        rating: 4.5,
        totalRatings: 63,
        isApproved: true,
        isVerified: true,
        approvedBy: admin._id,
        approvedAt: new Date("2025-07-12"),
      },
      {
        stationName: "HP Petrol Pump - Beltola",
        ownerName: "Sunil Joshi",
        email: "hppump@example.com",
        password: PASSWORD,
        phone: "+919900200003",
        address: "Beltola Chariali, Guwahati, Assam",
        location: { type: "Point", coordinates: [91.78, 26.125] },
        fuelTypes: [
          { type: "Petrol", price: 102.86, available: true },
          { type: "Diesel", price: 88.94, available: true },
        ],
        licenseNumber: "FUEL-AS-003",
        licenseCopy: "license-hp.pdf",
        openingHours: "24 Hours",
        deliveryAvailable: false,
        deliveryRadius: 0,
        deliveryCharges: 0,
        minimumOrderQuantity: 5,
        rating: 4.2,
        totalRatings: 35,
        isApproved: true,
        isVerified: true,
        approvedBy: admin._id,
        approvedAt: new Date("2025-08-05"),
      },
      {
        stationName: "Nayara Energy - Dispur",
        ownerName: "Arvind Mehta",
        email: "nayara.wf@example.com",
        password: PASSWORD,
        phone: "+919900200004",
        address: "Dispur, Guwahati, Assam",
        location: { type: "Point", coordinates: [91.788, 26.144] },
        fuelTypes: [
          { type: "Petrol", price: 102.86, available: true },
          { type: "Diesel", price: 88.94, available: true },
        ],
        licenseNumber: "FUEL-AS-004",
        licenseCopy: "license-nayara.pdf",
        openingHours: "5:00 AM - 10:00 PM",
        deliveryAvailable: true,
        deliveryRadius: 5,
        deliveryCharges: 35,
        minimumOrderQuantity: 5,
        rating: 0,
        totalRatings: 0,
        isApproved: false,
        isVerified: false,
      },
      {
        stationName: "Reliance Petroleum - Maligaon",
        ownerName: "Kamal Bora",
        email: "reliance.maligaon@example.com",
        password: PASSWORD,
        phone: "+919900200005",
        address: "Maligaon Chariali, Guwahati, Assam",
        location: { type: "Point", coordinates: [91.718, 26.178] },
        fuelTypes: [
          { type: "Petrol", price: 102.86, available: true },
          { type: "Diesel", price: 88.94, available: true },
          { type: "CNG", price: 76.59, available: true },
        ],
        licenseNumber: "FUEL-AS-005",
        licenseCopy: "license-reliance.pdf",
        openingHours: "24 Hours",
        deliveryAvailable: true,
        deliveryRadius: 12,
        deliveryCharges: 45,
        minimumOrderQuantity: 5,
        rating: 4.4,
        totalRatings: 42,
        isApproved: true,
        isVerified: true,
        approvedBy: admin._id,
        approvedAt: new Date("2025-10-20"),
      },
      {
        stationName: "Indian Oil - Chandmari",
        ownerName: "Nitin Hazarika",
        email: "indianoil.chandmari@example.com",
        password: PASSWORD,
        phone: "+919900200006",
        address: "Chandmari, Guwahati, Assam",
        location: { type: "Point", coordinates: [91.756, 26.17] },
        fuelTypes: [
          { type: "Petrol", price: 102.86, available: true },
          { type: "Diesel", price: 88.94, available: true },
        ],
        licenseNumber: "FUEL-AS-006",
        licenseCopy: "license-indianoil-chandmari.pdf",
        openingHours: "6:00 AM - 11:00 PM",
        deliveryAvailable: true,
        deliveryRadius: 10,
        deliveryCharges: 40,
        minimumOrderQuantity: 5,
        rating: 4.6,
        totalRatings: 55,
        isApproved: true,
        isVerified: true,
        approvedBy: admin._id,
        approvedAt: new Date("2025-11-05"),
      },
    ]);

    const [
      bharatPetro,
      indianOil,
      hpPump,
      nayara,
      relianceMaligaon,
      indianOilChandmari,
    ] = stations;
    console.log(
      `   Created ${stations.length} fuel stations (1 pending approval)`,
    );

    /* ────────────────────── MECHANIC REQUESTS ────────────────── */
    console.log("📋 Creating mechanic requests…");
    const mechRequests = await MechanicRequest.create([
      {
        user: aarav._id,
        mechanic: rajesh._id,
        problemDescription:
          "Flat tyre on the front left – car is stuck on the roadside near Paltan Bazaar, Guwahati",
        location: { type: "Point", coordinates: [91.737, 26.145] },
        address: "Paltan Bazaar, Guwahati, Assam",
        status: "completed",
        estimatedCost: 1500,
        actualCost: 1200,
        mechanicNotes: "Replaced inner tube and patched tyre. Good to go.",
        acceptedAt: new Date("2026-03-07T08:05:00Z"),
        enRouteAt: new Date("2026-03-07T08:08:00Z"),
        arrivedAt: new Date("2026-03-07T08:18:00Z"),
        startedAt: new Date("2026-03-07T08:20:00Z"),
        completedAt: new Date("2026-03-07T08:45:00Z"),
        responseTime: 3,
        serviceTime: 25,
        distance: 0.8,
        createdAt: new Date("2026-03-07T08:02:00Z"),
      },
      {
        user: priya._id,
        mechanic: suresh._id,
        problemDescription:
          "Engine failure – car won't start, makes clicking sound when turning the key",
        location: { type: "Point", coordinates: [91.744, 26.18] },
        address: "Fancy Bazaar, Guwahati, Assam",
        status: "in-progress",
        estimatedCost: 3500,
        actualCost: 0,
        acceptedAt: new Date("2026-03-08T09:15:00Z"),
        enRouteAt: new Date("2026-03-08T09:18:00Z"),
        arrivedAt: new Date("2026-03-08T09:30:00Z"),
        startedAt: new Date("2026-03-08T09:35:00Z"),
        responseTime: 5,
        distance: 1.4,
        createdAt: new Date("2026-03-08T09:10:00Z"),
      },
      {
        user: vikram._id,
        mechanic: rajesh._id,
        problemDescription:
          "Battery dead – headlights were left on overnight, need a jump start urgently",
        location: { type: "Point", coordinates: [91.788, 26.144] },
        address: "Dispur, Guwahati, Assam",
        status: "accepted",
        estimatedCost: 800,
        acceptedAt: new Date("2026-03-08T10:05:00Z"),
        responseTime: 2,
        distance: 2.1,
        createdAt: new Date("2026-03-08T10:03:00Z"),
      },
      {
        user: sneha._id,
        mechanic: manoj._id,
        problemDescription:
          "Car overheating – temperature gauge in the red, steam coming from the bonnet",
        location: { type: "Point", coordinates: [91.78, 26.125] },
        address: "Beltola Chariali, Guwahati, Assam",
        status: "pending",
        estimatedCost: 2500,
        distance: 3.0,
        createdAt: new Date("2026-03-08T10:30:00Z"),
      },
      {
        user: rohit._id,
        mechanic: suresh._id,
        problemDescription:
          "Brakes making grinding noise – not safe to drive, need immediate inspection",
        location: { type: "Point", coordinates: [91.755, 26.168] },
        address: "Chandmari, Guwahati, Assam",
        status: "completed",
        estimatedCost: 4000,
        actualCost: 3800,
        mechanicNotes:
          "Brake pads replaced on both front wheels. Rotors in good condition.",
        acceptedAt: new Date("2026-03-06T14:10:00Z"),
        enRouteAt: new Date("2026-03-06T14:12:00Z"),
        arrivedAt: new Date("2026-03-06T14:30:00Z"),
        startedAt: new Date("2026-03-06T14:35:00Z"),
        completedAt: new Date("2026-03-06T15:20:00Z"),
        responseTime: 4,
        serviceTime: 45,
        distance: 2.5,
        createdAt: new Date("2026-03-06T14:06:00Z"),
      },
      {
        user: ananya._id,
        mechanic: rajesh._id,
        problemDescription:
          "Flat tyre on the highway – rear right tyre punctured by a nail on NH 37",
        location: { type: "Point", coordinates: [91.775, 26.154] },
        address: "Ganeshguri, Guwahati, Assam",
        status: "cancelled",
        estimatedCost: 1000,
        cancellationReason:
          "Found a nearby tyre shop, no longer need assistance",
        cancelledBy: "user",
        cancelledAt: new Date("2026-03-05T17:20:00Z"),
        createdAt: new Date("2026-03-05T17:05:00Z"),
      },
    ]);
    console.log(`   Created ${mechRequests.length} mechanic requests`);

    /* ────────────────────── FUEL REQUESTS ─────────────────────── */
    console.log("⛽ Creating fuel requests…");
    const fuelRequests = await FuelRequest.create([
      {
        user: aarav._id,
        fuelStation: bharatPetro._id,
        fuelType: "Petrol",
        quantity: 20,
        deliveryLocation: { type: "Point", coordinates: [91.737, 26.145] },
        address: "Paltan Bazaar, Guwahati, Assam",
        pricePerLiter: 102.86,
        deliveryCharges: 50,
        totalPrice: 20 * 102.86 + 50,
        status: "delivered",
        paymentStatus: "paid",
        paymentMethod: "upi",
        deliveryPersonName: "Ravi Shankar",
        deliveryPersonPhone: "+919845500001",
        vehicleNumber: "AS 01 AB 1234",
        deliveryTime: new Date("2026-03-06T11:45:00Z"),
        confirmedAt: new Date("2026-03-06T11:00:00Z"),
        createdAt: new Date("2026-03-06T10:50:00Z"),
      },
      {
        user: priya._id,
        fuelStation: indianOil._id,
        fuelType: "Diesel",
        quantity: 30,
        deliveryLocation: { type: "Point", coordinates: [91.744, 26.18] },
        address: "Fancy Bazaar, Guwahati, Assam",
        pricePerLiter: 88.94,
        deliveryCharges: 40,
        totalPrice: 30 * 88.94 + 40,
        status: "out-for-delivery",
        paymentStatus: "pending",
        paymentMethod: "online",
        deliveryPersonName: "Ganesh Babu",
        deliveryPersonPhone: "+919845500002",
        vehicleNumber: "AS 01 CD 5678",
        confirmedAt: new Date("2026-03-08T08:30:00Z"),
        createdAt: new Date("2026-03-08T08:15:00Z"),
      },
      {
        user: sneha._id,
        fuelStation: bharatPetro._id,
        fuelType: "Petrol",
        quantity: 15,
        deliveryLocation: { type: "Point", coordinates: [91.78, 26.125] },
        address: "Beltola, Guwahati, Assam",
        pricePerLiter: 102.86,
        deliveryCharges: 50,
        totalPrice: 15 * 102.86 + 50,
        status: "confirmed",
        paymentStatus: "pending",
        paymentMethod: "card",
        confirmedAt: new Date("2026-03-08T09:00:00Z"),
        createdAt: new Date("2026-03-08T08:45:00Z"),
      },
      {
        user: vikram._id,
        fuelStation: hpPump._id,
        fuelType: "Petrol",
        quantity: 10,
        deliveryLocation: { type: "Point", coordinates: [91.788, 26.144] },
        address: "Dispur, Guwahati, Assam",
        pricePerLiter: 102.86,
        deliveryCharges: 0,
        totalPrice: 10 * 102.86,
        status: "pending",
        paymentStatus: "pending",
        paymentMethod: "cash",
        createdAt: new Date("2026-03-08T10:00:00Z"),
      },
      {
        user: rohit._id,
        fuelStation: indianOil._id,
        fuelType: "Petrol",
        quantity: 25,
        deliveryLocation: { type: "Point", coordinates: [91.755, 26.168] },
        address: "Chandmari, Guwahati, Assam",
        pricePerLiter: 102.86,
        deliveryCharges: 40,
        totalPrice: 25 * 102.86 + 40,
        status: "cancelled",
        paymentStatus: "pending",
        paymentMethod: "upi",
        cancellationReason: "Found petrol bunk nearby, no longer need delivery",
        cancelledBy: "user",
        createdAt: new Date("2026-03-07T15:00:00Z"),
      },
    ]);
    console.log(`   Created ${fuelRequests.length} fuel requests`);

    /* ────────────────────────── FEEDBACK ──────────────────────── */
    console.log("⭐ Creating feedback…");
    const feedbacks = await Feedback.create([
      {
        user: aarav._id,
        serviceProvider: rajesh._id,
        serviceType: "Mechanic",
        request: mechRequests[0]._id,
        requestType: "MechanicRequest",
        rating: 5,
        comment:
          "Rajesh bhai arrived super fast and fixed my tyre in no time. Very professional!",
        categories: {
          timeliness: 5,
          professionalism: 5,
          quality: 5,
          communication: 5,
          value: 4,
        },
        isPublic: true,
      },
      {
        user: rohit._id,
        serviceProvider: suresh._id,
        serviceType: "Mechanic",
        request: mechRequests[4]._id,
        requestType: "MechanicRequest",
        rating: 4,
        comment:
          "Good work on the brakes. Took a bit longer than expected but quality was excellent.",
        categories: {
          timeliness: 3,
          professionalism: 4,
          quality: 5,
          communication: 4,
          value: 4,
        },
        isPublic: true,
      },
      {
        user: aarav._id,
        serviceProvider: bharatPetro._id,
        serviceType: "FuelStation",
        request: fuelRequests[0]._id,
        requestType: "FuelRequest",
        rating: 5,
        comment:
          "Fast delivery via UPI payment, fuel quantity was exact. User was polite and helpful.",
        categories: {
          timeliness: 5,
          professionalism: 5,
          quality: 5,
          communication: 4,
          value: 5,
        },
        isPublic: true,
      },
      {
        user: ananya._id,
        serviceProvider: rajesh._id,
        serviceType: "Mechanic",
        request: mechRequests[5]._id,
        requestType: "MechanicRequest",
        rating: 3,
        comment:
          "Cancelled request – but response time to accept was very quick.",
        categories: {
          timeliness: 4,
          professionalism: 3,
          quality: 3,
          communication: 3,
          value: 3,
        },
        isPublic: false,
      },
    ]);
    console.log(`   Created ${feedbacks.length} feedback entries`);

    /* ────────────────────────── SUMMARY ──────────────────────── */
    console.log("\n🎉 Seed complete! Here are the test accounts:\n");
    console.log("──────────────────────────────────────────────────────────");
    console.log("  ROLE          EMAIL                          PASSWORD");
    console.log("──────────────────────────────────────────────────────────");
    console.log("  Admin         admin@onroad.com               Test@1234");
    console.log("  User          aarav@example.com               Test@1234");
    console.log("  User          priya@example.com               Test@1234");
    console.log("  User          vikram@example.com              Test@1234");
    console.log("  User          sneha@example.com               Test@1234");
    console.log("  User          rohit@example.com               Test@1234");
    console.log("  User          ananya@example.com              Test@1234");
    console.log("  Mechanic      rajesh.mechanic@example.com     Test@1234");
    console.log("  Mechanic      suresh.mechanic@example.com     Test@1234");
    console.log("  Mechanic      manoj.mechanic@example.com      Test@1234");
    console.log(
      "  Mechanic      lakshmi.mechanic@example.com    Test@1234  (offline)",
    );
    console.log(
      "  Mechanic      deepak.mechanic@example.com     Test@1234  (pending)",
    );
    console.log("  Mechanic      biren.mechanic@example.com      Test@1234");
    console.log("  Mechanic      hari.mechanic@example.com       Test@1234");
    console.log("  FuelStation   bharatpetro@example.com         Test@1234");
    console.log("  FuelStation   indianoil.inr@example.com       Test@1234");
    console.log("  FuelStation   hppump@example.com              Test@1234");
    console.log(
      "  FuelStation   nayara.wf@example.com           Test@1234  (pending)",
    );
    console.log("  FuelStation   reliance.maligaon@example.com   Test@1234");
    console.log("  FuelStation   indianoil.chandmari@example.com Test@1234");
    console.log("──────────────────────────────────────────────────────────\n");

    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
    process.exit(1);
  }
}

seed();
