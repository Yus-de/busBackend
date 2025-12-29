require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedData() {
  try {
    console.log('🌱 Seeding database...');

    // Create sample routes
    const route1 = await prisma.route.upsert({
      where: {
        source_destination: {
          source: 'New York',
          destination: 'Boston',
        },
      },
      update: {},
      create: {
        source: 'New York',
        destination: 'Boston',
        distance: 306.5,
        duration: 240, // 4 hours
      },
    });

    const route2 = await prisma.route.upsert({
      where: {
        source_destination: {
          source: 'Los Angeles',
          destination: 'San Francisco',
        },
      },
      update: {},
      create: {
        source: 'Los Angeles',
        destination: 'San Francisco',
        distance: 382.9,
        duration: 360, // 6 hours
      },
    });

    console.log('✅ Routes created');

    // Create sample buses
    const bus1 = await prisma.bus.upsert({
      where: { busNumber: 'BUS-001' },
      update: {},
      create: {
        busNumber: 'BUS-001',
        busName: 'Luxury Express',
        totalSeats: 40,
        seatLayout: {
          rows: 10,
          seatsPerRow: 4,
          layout: '2x2',
        },
        amenities: ['AC', 'WiFi', 'Charging', 'Reclining'],
      },
    });

    const bus2 = await prisma.bus.upsert({
      where: { busNumber: 'BUS-002' },
      update: {},
      create: {
        busNumber: 'BUS-002',
        busName: 'Comfort Plus',
        totalSeats: 45,
        seatLayout: {
          rows: 9,
          seatsPerRow: 5,
          layout: '3x2',
        },
        amenities: ['AC', 'WiFi'],
      },
    });

    console.log('✅ Buses created');

    // Create sample schedules
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(8, 0, 0, 0);

    const arrival1 = new Date(tomorrow);
    arrival1.setHours(12, 0, 0, 0);

    const schedule1 = await prisma.schedule.create({
      data: {
        busId: bus1.id,
        routeId: route1.id,
        departureTime: tomorrow,
        arrivalTime: arrival1,
        price: 45.99,
        isActive: true,
      },
    });

    // Create seats for schedule1
    const seats = [];
    for (let row = 1; row <= 10; row++) {
      for (let col = 1; col <= 4; col++) {
        const seatLabel = `${row}${String.fromCharCode(64 + col)}`;
        seats.push({
          scheduleId: schedule1.id,
          seatNumber: seatLabel,
          isAvailable: true,
        });
      }
    }

    await prisma.seat.createMany({
      data: seats,
    });

    console.log('✅ Schedules and seats created');
    console.log('✅ Seeding completed!');
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedData();

