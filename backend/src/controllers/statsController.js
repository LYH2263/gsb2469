const prisma = require('../prisma');
const logger = require('../logger');

const getStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const [
      todayOrders,
      yesterdayOrders,
      activeDrivers,
      totalCities,
      totalGuiders,
      totalVehicles,
      processingOrders,
      totalOrdersCount,
      cancelledOrdersCount,
      completedOrdersCount,
      totalFleets,
      totalRestaurants,
      totalStores
    ] = await Promise.all([
      prisma.deliveryOrder.count({
        where: {
          createdAt: {
            gte: today
          }
        }
      }),
      prisma.deliveryOrder.count({
        where: {
          createdAt: {
            gte: yesterday,
            lt: today
          }
        }
      }),
      prisma.driver.count(),
      prisma.city.count(),
      prisma.guider.count(),
      prisma.vehicle.count(),
      prisma.deliveryOrder.count({
        where: {
          status: {
            notIn: ['Completed', 'Cancelled']
          }
        }
      }),
      prisma.deliveryOrder.count(),
      prisma.deliveryOrder.count({
        where: { status: 'Cancelled' }
      }),
      prisma.deliveryOrder.count({
        where: { status: 'Completed' }
      }),
      prisma.fleet.count(),
      prisma.restaurant.count(),
      prisma.store.count()
    ]);

    // Calculate order completion rate: Completed / (Total - Cancelled)
    const validOrdersCount = totalOrdersCount - cancelledOrdersCount;
    const completionRate = validOrdersCount > 0 
      ? ((completedOrdersCount / validOrdersCount) * 100).toFixed(1) 
      : "100.0";

    // Last 7 days trend
    const trend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      
      const nextD = new Date(d);
      nextD.setDate(nextD.getDate() + 1);

      const count = await prisma.deliveryOrder.count({
        where: {
          createdAt: {
            gte: d,
            lt: nextD
          }
        }
      });
      
      trend.push({
        label: d.toISOString().split('T')[0].substring(5), // MM-DD
        value: count
      });
    }

    res.json({
      todayOrders,
      activeDrivers,
      totalCities,
      completionRate,
      resourceStats: [
        { name: '城市总数', value: totalCities },
        { name: '车队总数', value: totalFleets },
        { name: '车辆总数', value: totalVehicles },
        { name: '司机总数', value: activeDrivers },
        { name: '导游总数', value: totalGuiders },
        { name: '餐馆总数', value: totalRestaurants },
        { name: '购物店总数', value: totalStores },
        { name: '进行中订单', value: processingOrders },
        { name: '已完成订单', value: completedOrdersCount }
      ],
      orderTrend: trend,
      yesterdayOrders
    });
  } catch (error) {
    logger.error(`[Stats getStats] Error: ${error.message}`, { error });
    res.status(500).json({ message: '统计数据获取失败，请稍后重试' });
  }
};

module.exports = { getStats };
