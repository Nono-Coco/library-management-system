const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  // 清空现有数据（避免重复键冲突）
  await prisma.auditLog.deleteMany();
  await prisma.hold.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.rating.deleteMany();
  await prisma.loan.deleteMany();
  await prisma.book.deleteMany();
  await prisma.user.deleteMany();
  await prisma.config.deleteMany();

  // 创建用户
  const adminPassword = await bcrypt.hash('admin123', 10);
  const librarianPassword = await bcrypt.hash('lib123', 10);
  const studentPassword = await bcrypt.hash('student123', 10);

  await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@library.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
    },
  });

  await prisma.user.create({
    data: {
      name: 'Librarian User',
      email: 'librarian@library.com',
      passwordHash: librarianPassword,
      role: 'LIBRARIAN',
    },
  });

  await prisma.user.create({
    data: {
      name: 'Student One',
      email: 'student1@university.edu',
      passwordHash: studentPassword,
      studentId: 'S12345',
      role: 'STUDENT',
    },
  });

  await prisma.user.create({
    data: {
      name: 'Student Two',
      email: 'student2@university.edu',
      passwordHash: studentPassword,
      studentId: 'S67890',
      role: 'STUDENT',
    },
  });

  // 图书数据
  const booksData = [
    // Technology
    { title: 'The Pragmatic Programmer', author: 'David Thomas', genre: 'Technology', available: true },
    { title: 'Clean Code', author: 'Robert C. Martin', genre: 'Technology', available: true },
    { title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann', genre: 'Technology', available: true },
    { title: "You Don't Know JS", author: 'Kyle Simpson', genre: 'Technology', available: false },
    // Fiction
    { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', genre: 'Fiction', available: true },
    { title: 'To Kill a Mockingbird', author: 'Harper Lee', genre: 'Fiction', available: true },
    { title: '1984', author: 'George Orwell', genre: 'Fiction', available: true },
    { title: 'Pride and Prejudice', author: 'Jane Austen', genre: 'Fiction', available: false },
    // Science
    { title: 'A Brief History of Time', author: 'Stephen Hawking', genre: 'Science', available: true },
    { title: 'The Selfish Gene', author: 'Richard Dawkins', genre: 'Science', available: true },
    { title: 'Cosmos', author: 'Carl Sagan', genre: 'Science', available: true },
    { title: 'The Double Helix', author: 'James Watson', genre: 'Science', available: false },
    // History
    { title: 'Sapiens', author: 'Yuval Noah Harari', genre: 'History', available: true },
    { title: 'Guns, Germs, and Steel', author: 'Jared Diamond', genre: 'History', available: true },
    { title: 'The Silk Roads', author: 'Peter Frankopan', genre: 'History', available: true },
    { title: "A People's History of the United States", author: 'Howard Zinn', genre: 'History', available: false },
    // Management
    { title: 'The Lean Startup', author: 'Eric Ries', genre: 'Management', available: true },
    { title: 'Good to Great', author: 'Jim Collins', genre: 'Management', available: true },
    { title: 'Drive', author: 'Daniel H. Pink', genre: 'Management', available: true },
    { title: 'The Five Dysfunctions of a Team', author: 'Patrick Lencioni', genre: 'Management', available: false },
  ];

  for (const book of booksData) {
    await prisma.book.create({
      data: {
        title: book.title,
        author: book.author,
        isbn: `ISBN-${Math.random().toString(36).substring(2, 10)}`,
        genre: book.genre,
        description: `${book.title} is a great read.`,
        language: 'English',
        shelfLocation: `${book.genre}-${Math.floor(Math.random() * 100)}`,
        available: book.available,
        totalCopies: 1,
        availableCopies: book.available ? 1 : 0,
      },
    });
  }

  // 添加配置项
  await prisma.config.create({
    data: {
      key: 'FINE_RATE_PER_DAY',
      value: '0.50',
    },
  });

  console.log('Seed data inserted successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });