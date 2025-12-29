require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createCashier() {
  try {
    const email = process.argv[2] || 'cashier@example.com';
    const password = process.argv[3] || 'cashier123';
    const name = process.argv[4] || 'Cashier User';

    // Check if cashier already exists
    const existingCashier = await prisma.user.findUnique({
      where: { email },
    });

    if (existingCashier) {
      console.log('❌ User already exists with this email:', email);
      process.exit(1);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create cashier user
    const cashier = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'CASHIER',
        emailVerified: true, // Cashiers are created by admin, so email is pre-verified
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    console.log('✅ Cashier user created successfully!');
    console.log('📧 Email:', cashier.email);
    console.log('👤 Name:', cashier.name);
    console.log('🔑 Role:', cashier.role);
    console.log('⚠️  Password:', password, '(please change this after first login)');
  } catch (error) {
    console.error('❌ Error creating cashier:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createCashier();

