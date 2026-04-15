const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

// 配置常量
const CONFIG = {
  PASSWORD_HASH_ROUNDS: 10,
  DEFAULT_PASSWORD: 'password123',
  ADMIN_PASSWORD: 'admin123',
  LIBRARIAN_PASSWORD: 'lib123',
  STUDENT_PASSWORD: 'student123',
};

// 预定义的测试账号
const TEST_ACCOUNTS = {
  admin: {
    email: 'admin@library.com',
    password: CONFIG.ADMIN_PASSWORD,
    name: '系统管理员',
  },
  librarians: [
    {
      employeeId: 'LIB001',
      password: CONFIG.LIBRARIAN_PASSWORD,
      name: '张明',
    },
    {
      employeeId: 'LIB002',
      password: CONFIG.LIBRARIAN_PASSWORD,
      name: '李华',
    },
    {
      employeeId: 'LIB003',
      password: CONFIG.LIBRARIAN_PASSWORD,
      name: '王芳',
    },
  ],
  students: [
    {
      studentId: 'S2021001',
      email: 'student1@university.edu',
      password: CONFIG.STUDENT_PASSWORD,
      name: '张三',
    },
    {
      studentId: 'S2021002',
      email: 'student2@university.edu',
      password: CONFIG.STUDENT_PASSWORD,
      name: '李四',
    },
    {
      studentId: 'S2021003',
      email: 'student3@university.edu',
      password: CONFIG.STUDENT_PASSWORD,
      name: '王五',
    },
    {
      studentId: 'S2021004',
      email: 'student4@university.edu',
      password: CONFIG.STUDENT_PASSWORD,
      name: '赵六',
    },
    {
      studentId: 'S2021005',
      email: 'student5@university.edu',
      password: CONFIG.STUDENT_PASSWORD,
      name: '孙七',
    },
  ],
};

// 图书数据
const BOOKS_DATA = [
  // Technology
  {
    title: 'The Pragmatic Programmer',
    author: 'David Thomas & Andrew Hunt',
    isbn: '978-0201616224',
    genre: 'Technology',
    description: 'A must-read for any programmer, filled with practical advice and best practices.',
    language: 'English',
  },
  {
    title: 'Clean Code',
    author: 'Robert C. Martin',
    isbn: '978-0132350884',
    genre: 'Technology',
    description: 'A handbook of agile software craftsmanship.',
    language: 'English',
  },
  {
    title: 'Designing Data-Intensive Applications',
    author: 'Martin Kleppmann',
    isbn: '978-1449373320',
    genre: 'Technology',
    description: 'The big ideas behind reliable, scalable, and maintainable systems.',
    language: 'English',
  },
  {
    title: "You Don't Know JS",
    author: 'Kyle Simpson',
    isbn: '978-1491904244',
    genre: 'Technology',
    description: 'Deep dive into JavaScript language features.',
    language: 'English',
  },
  // Fiction
  {
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    isbn: '978-0743273565',
    genre: 'Fiction',
    description: 'A story of decadence and excess in Jazz Age America.',
    language: 'English',
  },
  {
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    isbn: '978-0446310789',
    genre: 'Fiction',
    description: 'A powerful story of racial injustice in the American South.',
    language: 'English',
  },
  {
    title: '1984',
    author: 'George Orwell',
    isbn: '978-0451524935',
    genre: 'Fiction',
    description: 'A dystopian novel about totalitarianism and surveillance.',
    language: 'English',
  },
  {
    title: 'Pride and Prejudice',
    author: 'Jane Austen',
    isbn: '978-0141439518',
    genre: 'Fiction',
    description: 'A classic romance novel about manners and marriage.',
    language: 'English',
  },
  // Science
  {
    title: 'A Brief History of Time',
    author: 'Stephen Hawking',
    isbn: '978-0553380163',
    genre: 'Science',
    description: 'From the Big Bang to black holes.',
    language: 'English',
  },
  {
    title: 'The Selfish Gene',
    author: 'Richard Dawkins',
    isbn: '978-0199291151',
    genre: 'Science',
    description: 'A gene-centered view of evolution.',
    language: 'English',
  },
  {
    title: 'Cosmos',
    author: 'Carl Sagan',
    isbn: '978-0345539434',
    genre: 'Science',
    description: 'A journey through space and time.',
    language: 'English',
  },
  {
    title: 'The Double Helix',
    author: 'James Watson',
    isbn: '978-0743216302',
    genre: 'Science',
    description: 'The story of the discovery of DNA structure.',
    language: 'English',
  },
  // History
  {
    title: 'Sapiens',
    author: 'Yuval Noah Harari',
    isbn: '978-0062316097',
    genre: 'History',
    description: 'A brief history of humankind.',
    language: 'English',
  },
  {
    title: 'Guns, Germs, and Steel',
    author: 'Jared Diamond',
    isbn: '978-0393317558',
    genre: 'History',
    description: 'The fates of human societies.',
    language: 'English',
  },
  {
    title: 'The Silk Roads',
    author: 'Peter Frankopan',
    isbn: '978-1101912379',
    genre: 'History',
    description: 'A new history of the world.',
    language: 'English',
  },
  // Management
  {
    title: 'The Lean Startup',
    author: 'Eric Ries',
    isbn: '978-0307887894',
    genre: 'Management',
    description: 'How today\'s entrepreneurs use continuous innovation.',
    language: 'English',
  },
  {
    title: 'Good to Great',
    author: 'Jim Collins',
    isbn: '978-0066620992',
    genre: 'Management',
    description: 'Why some companies make the leap and others don\'t.',
    language: 'English',
  },
  {
    title: 'Drive',
    author: 'Daniel H. Pink',
    isbn: '978-1594484803',
    genre: 'Management',
    description: 'The surprising truth about what motivates us.',
    language: 'English',
  },
  // Chinese Books
  {
    title: '三体',
    author: '刘慈欣',
    isbn: '978-7536692930',
    genre: 'Science Fiction',
    description: '中国科幻文学的里程碑之作。',
    language: 'Chinese',
  },
  {
    title: '活着',
    author: '余华',
    isbn: '978-7506365437',
    genre: 'Fiction',
    description: '讲述了一个人历尽世间沧桑和磨难的一生。',
    language: 'Chinese',
  },
];

// 系统配置
const SYSTEM_CONFIGS = [
  { key: 'FINE_RATE_PER_DAY', value: '0.50', description: '每日逾期罚款金额（元）' },
  { key: 'MAX_BORROW_STUDENT', value: '3', description: '学生最大借阅数量' },
  { key: 'LOAN_DURATION_DAYS', value: '30', description: '默认借阅天数' },
  { key: 'MAX_RENEW_TIMES', value: '2', description: '最大续借次数' },
  { key: 'RENEW_DURATION_DAYS', value: '15', description: '续借天数' },
  { key: 'LIBRARY_NAME', value: '大学图书馆管理系统', description: '图书馆名称' },
  { key: 'LIBRARY_HOURS', value: '周一至周五 8:00-22:00，周末 9:00-21:00', description: '开放时间' },
  { key: 'CONTACT_EMAIL', value: 'library@university.edu', description: '联系邮箱' },
  { key: 'CONTACT_PHONE', value: '123-4567-8901', description: '联系电话' },
];

// 辅助函数
function generateISBN(index) {
  return `978-${String(index).padStart(10, '0')}`;
}

function generateBarcode(bookId, copyNumber) {
  return `BC-${String(bookId).padStart(6, '0')}-${String(copyNumber).padStart(3, '0')}`;
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// 主函数
async function main() {
  console.log('🚀 开始初始化数据库...\n');

  // ==================== 清空现有数据 ====================
  console.log('📦 清空现有数据...');
  
  const deleteOperations = [
    { name: '审计日志', model: prisma.auditLog },
    { name: '公告发布者', model: prisma.announcementPublisher },
    { name: '公告', model: prisma.announcement },
    { name: '预约', model: prisma.hold },
    { name: '心愿单', model: prisma.wishlist },
    { name: '评分', model: prisma.rating },
    { name: '借阅记录', model: prisma.loan },
    { name: '副本', model: prisma.copy },
    { name: '图书', model: prisma.book },
    { name: '用户', model: prisma.user },
    { name: '馆员', model: prisma.librarian },
    { name: '配置', model: prisma.config },
  ];

  for (const op of deleteOperations) {
    try {
      await op.model.deleteMany();
      console.log(`  ✓ 清空${op.name}`);
    } catch (error) {
      // 某些表可能不存在，忽略错误
    }
  }

  console.log('\n✅ 数据清空完成\n');

  // ==================== 创建用户 ====================
  console.log('👥 创建用户账号...');

  // 创建管理员
  const adminPasswordHash = await bcrypt.hash(TEST_ACCOUNTS.admin.password, CONFIG.PASSWORD_HASH_ROUNDS);
  const admin = await prisma.user.create({
    data: {
      name: TEST_ACCOUNTS.admin.name,
      email: TEST_ACCOUNTS.admin.email,
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
    },
  });
  console.log(`  ✓ 管理员: ${admin.email} / ${TEST_ACCOUNTS.admin.password}`);

  // 创建学生
  const students = [];
  const studentPasswordHash = await bcrypt.hash(CONFIG.STUDENT_PASSWORD, CONFIG.PASSWORD_HASH_ROUNDS);
  
  for (const studentData of TEST_ACCOUNTS.students) {
    const student = await prisma.user.create({
      data: {
        name: studentData.name,
        email: studentData.email,
        studentId: studentData.studentId,
        passwordHash: studentPasswordHash,
        role: 'STUDENT',
      },
    });
    students.push(student);
    console.log(`  ✓ 学生: ${student.studentId} - ${student.name} (${student.email})`);
  }

  // 创建馆员（使用 User 表，role='LIBRARIAN'）
const librarianPasswordHash = await bcrypt.hash(CONFIG.LIBRARIAN_PASSWORD, CONFIG.PASSWORD_HASH_ROUNDS);

for (const librarianData of TEST_ACCOUNTS.librarians) {
  const librarian = await prisma.user.create({
    data: {
      email: `${librarianData.employeeId.toLowerCase()}@library.com`, // 根据工号生成一个登录邮箱
      name: librarianData.name,
      employeeId: librarianData.employeeId, // 确保你的 User 模型有这个字段
      passwordHash: librarianPasswordHash,
      role: 'LIBRARIAN', // 角色设置为馆员
    },
  });
  console.log(`  ✓ 馆员: ${librarian.employeeId} - ${librarian.name} / ${CONFIG.LIBRARIAN_PASSWORD}`);
}

  console.log('\n✅ 用户创建完成\n');

  // ==================== 创建系统配置 ====================
  console.log('⚙️  创建系统配置...');
  
  for (const config of SYSTEM_CONFIGS) {
    await prisma.config.create({
      data: {
        key: config.key,
        value: config.value,
      },
    });
    console.log(`  ✓ ${config.key} = ${config.value} (${config.description})`);
  }

  console.log('\n✅ 系统配置创建完成\n');

  // ==================== 创建图书和副本 ====================
  console.log('📚 创建图书和副本...');
  
  const floorOptions = [1, 2, 3, 4, 5];
  const areaOptions = {
    'Technology': '科技图书区',
    'Fiction': '文学小说区',
    'Science': '自然科学区',
    'History': '历史地理区',
    'Management': '管理科学区',
    'Science Fiction': '科幻小说区',
  };
  const shelfOptions = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  let bookCount = 0;
  let copyCount = 0;

  for (const bookData of BOOKS_DATA) {
    // 创建图书
    const book = await prisma.book.create({
      data: {
        title: bookData.title,
        author: bookData.author,
        isbn: bookData.isbn,
        genre: bookData.genre,
        description: bookData.description,
        language: bookData.language,
      },
    });

    // 为每本书创建 1-5 个副本
    const numberOfCopies = getRandomInt(1, 5);
    const floor = getRandomElement(floorOptions);
    const area = areaOptions[bookData.genre] || '综合图书区';
    const shelf = getRandomElement(shelfOptions);

    for (let i = 0; i < numberOfCopies; i++) {
      const status = Math.random() > 0.3 ? 'AVAILABLE' : getRandomElement(['BORROWED', 'AVAILABLE']);
      
      await prisma.copy.create({
        data: {
          bookId: book.id,
          barcode: generateBarcode(book.id, i + 1),
          floor: floor,
          libraryArea: area,
          shelfNo: shelf,
          shelfLevel: getRandomInt(1, 5),
          status: status,
        },
      });
      copyCount++;
    }

    bookCount++;
  }

  console.log(`  ✓ 创建了 ${bookCount} 本图书，共 ${copyCount} 个副本`);

  console.log('\n✅ 图书创建完成\n');

  // ==================== 创建示例借阅记录 ====================
  console.log('📋 创建示例借阅记录...');
  
  if (students.length > 0) {
    const allCopies = await prisma.copy.findMany({
      where: { status: 'AVAILABLE' },
      take: 10,
    });

    const loanCount = Math.min(5, allCopies.length);
    
    for (let i = 0; i < loanCount; i++) {
      const student = students[i % students.length];
      const copy = allCopies[i];
      
      const checkoutDate = new Date();
      checkoutDate.setDate(checkoutDate.getDate() - getRandomInt(1, 60));
      
      const dueDate = new Date(checkoutDate);
      dueDate.setDate(dueDate.getDate() + 30);
      
      const isReturned = Math.random() > 0.5;
      const returnDate = isReturned ? new Date(dueDate.getTime() + getRandomInt(-5, 10) * 24 * 60 * 60 * 1000) : null;
      
      let fineAmount = 0;
      if (returnDate && returnDate > dueDate) {
        const diffDays = Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24));
        fineAmount = diffDays * 0.5;
      }

      await prisma.loan.create({
        data: {
          copyId: copy.id,
          userId: student.id,
          checkoutDate: checkoutDate,
          dueDate: dueDate,
          returnDate: returnDate,
          fineAmount: fineAmount,
          finePaid: fineAmount > 0 && Math.random() > 0.5,
        },
      });

      // 更新副本状态
      await prisma.copy.update({
        where: { id: copy.id },
        data: { status: isReturned ? 'AVAILABLE' : 'BORROWED' },
      });
    }
    
    console.log(`  ✓ 创建了 ${loanCount} 条借阅记录`);
  }

  console.log('\n✅ 示例数据创建完成\n');

  // ==================== 创建示例评分 ====================
  console.log('⭐ 创建示例评分...');
  
  const allBooks = await prisma.book.findMany({ take: 10 });
  let ratingCount = 0;
  
  for (const book of allBooks) {
    if (students.length > 0 && Math.random() > 0.5) {
      const ratingStudents = students.slice(0, getRandomInt(1, 3));
      
      for (const student of ratingStudents) {
        try {
          await prisma.rating.create({
            data: {
              bookId: book.id,
              userId: student.id,
              stars: getRandomInt(3, 5),
            },
          });
          ratingCount++;
        } catch (error) {
          // 忽略重复评分
        }
      }
    }
  }
  
  console.log(`  ✓ 创建了 ${ratingCount} 条评分`);

  console.log('\n✅ 评分创建完成\n');

  // ==================== 创建审计日志 ====================
  console.log('📝 创建审计日志...');
  
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: 'SYSTEM_INIT',
      entity: 'System',
      detail: '系统初始化完成，种子数据已加载',
    },
  });
  
  console.log('  ✓ 审计日志创建完成');

  // ==================== 输出测试账号信息 ====================
  console.log('\n' + '='.repeat(60));
  console.log('🎉 数据库初始化完成！');
  console.log('='.repeat(60));
  
  console.log('\n📋 测试账号信息：');
  console.log('-'.repeat(40));
  
  console.log('\n👑 管理员 (Admin):');
  console.log(`   邮箱: ${TEST_ACCOUNTS.admin.email}`);
  console.log(`   密码: ${TEST_ACCOUNTS.admin.password}`);
  console.log(`   姓名: ${TEST_ACCOUNTS.admin.name}`);
  
  console.log('\n📚 馆员 (Librarian):');
  TEST_ACCOUNTS.librarians.forEach((lib, index) => {
    console.log(`   ${index + 1}. 工号: ${lib.employeeId} / 密码: ${lib.password} (${lib.name})`);
  });
  
  console.log('\n🎓 学生 (Student):');
  TEST_ACCOUNTS.students.slice(0, 3).forEach((student, index) => {
    console.log(`   ${index + 1}. 学号: ${student.studentId} / 密码: ${student.password} (${student.name})`);
    console.log(`      邮箱: ${student.email}`);
  });
  if (TEST_ACCOUNTS.students.length > 3) {
    console.log(`   ... 还有 ${TEST_ACCOUNTS.students.length - 3} 个学生账号`);
  }
  
  console.log('\n📖 统计数据：');
  console.log(`   图书总数: ${bookCount}`);
  console.log(`   副本总数: ${copyCount}`);
  console.log(`   学生总数: ${students.length}`);
  console.log(`   馆员总数: ${librarians.length}`);
  
  console.log('\n💡 提示：');
  console.log('   1. 馆员登录请使用统一登录接口，选择 "librarian" 类型');
  console.log('   2. 学生和管理员登录使用邮箱');
  console.log('   3. 馆员登录使用工号');
  
  console.log('\n' + '='.repeat(60) + '\n');
}

// 执行主函数
main()
  .catch((e) => {
    console.error('\n❌ 种子数据初始化失败:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });