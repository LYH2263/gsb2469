const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function formatDateTime(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

async function main() {
  const hashedPassword = await bcrypt.hash('123456', 10);
  
  console.log('Starting seeding...');

  // 1. Create admin user
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
    },
  });

  // 2. Create Cities (10)
  const cityNames = [
    '北京', '上海', '广州', '深圳', '杭州',
    '成都', '重庆', '西安', '南京', '武汉'
  ];
  const cities = [];
  for (const name of cityNames) {
    const city = await prisma.city.upsert({
      where: { id: `city-${name.toLowerCase().replace(/\s/g, '-')}` },
      update: {},
      create: {
        id: `city-${name.toLowerCase().replace(/\s/g, '-')}`,
        name: name,
      }
    });
    cities.push(city);
  }
  console.log(`Created ${cities.length} cities`);

  // 3. Create Fleets (10)
  const fleets = await prisma.fleet.findMany();
  if (fleets.length < 10) {
    for (let i = fleets.length + 1; i <= 10; i++) {
      const fleet = await prisma.fleet.create({
        data: {
          name: `星河车队 ${i}`,
          leader: `负责人${i}`,
        contact: `1380000${i.toString().padStart(4, '0')}`,
          status: 'active'
        }
      });
      fleets.push(fleet);
    }
  }
  console.log(`Current fleet count: ${fleets.length}`);

  // 4. Create Vehicles (10)
  const vehicles = await prisma.vehicle.findMany();
  if (vehicles.length < 10) {
    const vehicleModels = [
      '丰田 凯美瑞', '本田 思域', '别克 GL8', '奔驰 E级', '宝马 5系',
      '丰田 海狮', '现代 H1', '本田 雅阁', '丰田 汉兰达', '理想 L9'
    ];
    for (let i = vehicles.length; i < 10; i++) {
      const vehicle = await prisma.vehicle.create({
        data: {
          name: vehicleModels[i],
          carPlatformName: '滴滴/高德',
          carPlatformId: `CN-${100 + i}`,
        }
      });
      vehicles.push(vehicle);
    }
  }
  console.log(`Current vehicle count: ${vehicles.length}`);

  // 5. Create Drivers (10)
  const drivers = [];
  for (let i = 1; i <= 10; i++) {
    const email = `driver${i}@example.com`;
    const driver = await prisma.driver.upsert({
      where: { email },
      update: {},
      create: {
        name: `司机${i}`,
        cityId: cities[i % cities.length].id,
        fleetId: fleets[i % fleets.length].id,
        email: email,
        password: hashedPassword,
        phone: `1391111${i.toString().padStart(4, '0')}`,
      }
    });
    drivers.push(driver);
  }
  console.log(`Created ${drivers.length} drivers`);

  // 6. Create Guiders (10)
  const guiders = [];
  for (let i = 1; i <= 10; i++) {
    const email = `guider${i}@example.com`;
    const guider = await prisma.guider.upsert({
      where: { email },
      update: {},
      create: {
        name: `导游${i}`,
        cityId: cities[i % cities.length].id,
        email: email,
        password: hashedPassword,
        phone: `1372222${i.toString().padStart(4, '0')}`,
        language: i % 2 === 0 ? '中文, 英语' : '中文, 日语',
      }
    });
    guiders.push(guider);
  }
  console.log(`Created ${guiders.length} guiders`);

  // 7. Create Restaurants (10)
  const restaurantCount = await prisma.restaurant.count();
  if (restaurantCount < 10) {
    for (let i = restaurantCount + 1; i <= 10; i++) {
      await prisma.restaurant.create({
        data: {
          name: `餐馆${i}`,
          cityId: cities[i % cities.length].id,
          address: `${cities[i % cities.length].name}美食街${i}号`,
          phone: `1363333${i.toString().padStart(4, '0')}`,
          combos: [
            { name: '标准套餐', price: 128 },
            { name: '豪华套餐', price: 258 }
          ]
        }
      });
    }
  }
  console.log('Ensured at least 10 restaurants');

  // 8. Create Stores (10)
  const storeCount = await prisma.store.count();
  if (storeCount < 10) {
    for (let i = storeCount + 1; i <= 10; i++) {
      await prisma.store.create({
        data: {
          name: `购物店${i}`,
          cityId: cities[i % cities.length].id,
          address: `${cities[i % cities.length].name}购物中心${i}层`,
          phone: `1354444${i.toString().padStart(4, '0')}`,
        }
      });
    }
  }
  console.log('Ensured at least 10 stores');

  // 9. Create Scenic Spots (10)
  const scenicSpotCount = await prisma.scenicSpot.count();
  if (scenicSpotCount < 10) {
    const spotNames = [
      '故宫博物院', '外滩', '广州塔', '世界之窗', '西湖',
      '九寨沟', '洪崖洞', '兵马俑', '中山陵', '黄鹤楼'
    ];
    const statuses = ['open', 'open', 'open', 'closed', 'open', 'open', 'open', 'open', 'closed', 'open'];
    for (let i = scenicSpotCount; i < 10; i++) {
      await prisma.scenicSpot.create({
        data: {
          name: spotNames[i],
          cityId: cities[i % cities.length].id,
          address: `${cities[i % cities.length].name}${spotNames[i]}景区`,
          phone: `135${i.toString().padStart(8, '0')}`,
          status: statuses[i]
        }
      });
    }
  }
  console.log('Ensured at least 10 scenic spots');

  // 10. Create Delivery Orders (50)
  const orderCount = await prisma.deliveryOrder.count();
  if (orderCount < 50) {
    const statuses = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];
    const now = new Date();
    for (let i = orderCount + 1; i <= 50; i++) {
      // Generate a date within the last 7 days or next 3 days
      const daysOffset = (i % 10) - 7; // range from -7 to +2
      const departureDate = new Date(now);
      departureDate.setDate(now.getDate() + daysOffset);
      departureDate.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

      await prisma.deliveryOrder.create({
        data: {
          platformName: i % 2 === 0 ? '携程' : '飞猪',
          orderRef: `CN-${2024000 + i}`,
          status: statuses[i % statuses.length],
          passengerName: `乘客${i}`,
          passengerTelno: `1380000${i.toString().padStart(4, '0')}`,
          pax: Math.floor(Math.random() * 4) + 1,
          adults: Math.floor(Math.random() * 2) + 1,
          children: Math.floor(Math.random() * 2),
          infants: 0,
          nonVehicle: 1,
          vehicleType: i % 3 === 0 ? '商务车' : '轿车',
          fromAddress: `${cities[i % cities.length].name}机场`,
          toAddress: `${cities[i % cities.length].name}酒店${i}`,
          startLocation: { lat: 39.90 + Math.random() * 0.1, lng: 116.40 + Math.random() * 0.1 },
          endLocation: { lat: 31.23 + Math.random() * 0.1, lng: 121.47 + Math.random() * 0.1 },
          departureTime: formatDateTime(departureDate),
          createdAt: departureDate, // Ensure dashboard trend works
          vehicleId: vehicles[i % vehicles.length].id,
          driverId: drivers[i % drivers.length].id,
          guiderId: guiders[i % guiders.length].id,
        }
      });
    }
  }
  console.log('Ensured at least 50 delivery orders with dates covering last 7 days');

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
