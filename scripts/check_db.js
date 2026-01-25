const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const count = await prisma.schedule.count();
    console.log(`Total schedules: ${count}`);

    const schedules = await prisma.schedule.findMany({
        include: {
            bus: true,
            route: true
        }
    });

    console.log('Schedules:', JSON.stringify(schedules, null, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
