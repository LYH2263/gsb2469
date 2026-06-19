const prisma = require('../prisma');
const logger = require('../logger');
const bcrypt = require('bcryptjs');

const createCRUDController = (modelName) => {
  return {
    getAll: async (req, res) => {
      try {
        const { search, page, pageSize } = req.query;
        let where = {};
        
        if (search) {
          // Simple search implementation for name or other common fields
          const searchableFields = getSearchableFields(modelName);
          if (searchableFields.length > 0) {
            where = {
              OR: searchableFields.map(field => ({
                [field]: { contains: search, mode: 'insensitive' }
              }))
            };
          }
        }

        // 分页参数处理
        const currentPage = parseInt(page) || 1;
        const itemsPerPage = parseInt(pageSize) || 10;
        const skip = (currentPage - 1) * itemsPerPage;

        const query = {
          where,
          include: getIncludes(modelName),
          skip,
          take: itemsPerPage,
          orderBy: { createdAt: 'desc' }
        };
        
        if (modelName === 'user') {
          delete query.include;
          query.select = { id: true, username: true, createdAt: true, updatedAt: true };
        }

        // 获取总数和列表数据
        const [total, items] = await Promise.all([
          prisma[modelName].count({ where }),
          prisma[modelName].findMany(query)
        ]);

        const data = sanitizeSensitive(modelName, items);
        res.json({
          list: data,
          total,
          page: currentPage,
          pageSize: itemsPerPage
        });
      } catch (err) {
        logger.error(`[CRUD getAll ${modelName}] Error: ${err.message}`, { error: err });
        res.status(500).json({ message: '获取数据失败，请稍后重试' });
      }
    },
    getOne: async (req, res) => {
      try {
        const query = {
          where: { id: req.params.id },
          include: getIncludes(modelName)
        };
        if (modelName === 'user') {
          delete query.include;
          query.select = { id: true, username: true, createdAt: true, updatedAt: true };
        }
        const item = await prisma[modelName].findUnique(query);
        if (!item) return res.status(404).json({ message: '记录不存在或已被删除' });
        res.json(sanitizeSensitive(modelName, item));
      } catch (err) {
        logger.error(`[CRUD getOne ${modelName}] Error: ${err.message}`, { error: err });
        res.status(500).json({ message: '获取数据失败，请稍后重试' });
      }
    },
    create: async (req, res) => {
      try {
        const { id, createdAt, updatedAt, ...data } = req.body;
        const payload = { ...data };
        if (['user', 'guider'].includes(modelName)) {
          if (!payload.password) {
            return res.status(400).json({ message: '密码不能为空' });
          }
          payload.password = await bcrypt.hash(payload.password, 10);
        }
        if (modelName === 'driver') {
          const rawPassword = payload.password || '123456';
          payload.password = await bcrypt.hash(rawPassword, 10);
        }
        const item = await prisma[modelName].create({
          data: payload,
          ...(modelName === 'user' ? { select: { id: true, username: true, createdAt: true, updatedAt: true } } : {})
        });
        res.status(201).json(item);
      } catch (err) {
        if (err.code === 'P2002') {
          const field = err.meta?.target?.[0] || '字段';
          return res.status(400).json({ message: `创建失败，${field} 已存在，请使用其他值` });
        }
        logger.error(`[CRUD create ${modelName}] Error: ${err.message}`, { error: err });
        res.status(500).json({ message: '服务器内部错误，请稍后重试' });
      }
    },
    update: async (req, res) => {
      try {
        const { id, createdAt, updatedAt, ...data } = req.body;
        const payload = { ...data };
        if (['user', 'driver', 'guider'].includes(modelName)) {
          if (payload.password) {
            payload.password = await bcrypt.hash(payload.password, 10);
          } else {
            delete payload.password;
          }
        }
        const item = await prisma[modelName].update({
          where: { id: req.params.id },
          data: payload,
          ...(modelName === 'user' ? { select: { id: true, username: true, createdAt: true, updatedAt: true } } : {})
        });
        res.json(item);
      } catch (err) {
        if (err.code === 'P2025') {
          return res.status(404).json({ message: '要更新的记录不存在' });
        }
        if (err.code === 'P2002') {
          const field = err.meta?.target?.[0] || '字段';
          return res.status(400).json({ message: `更新失败，${field} 已存在，请使用其他值` });
        }
        logger.error(`[CRUD update ${modelName}] Error: ${err.message}`, { error: err });
        res.status(500).json({ message: '服务器内部错误，请稍后重试' });
      }
    },
    delete: async (req, res) => {
      try {
        if (modelName === 'fleet') {
          await prisma.driver.updateMany({
            where: { fleetId: req.params.id },
            data: { fleetId: null }
          });
        } else if (modelName === 'city') {
          // 将关联的司机、导游、餐厅、购物店、景点的城市设为空
          await Promise.all([
            prisma.driver.updateMany({ where: { cityId: req.params.id }, data: { cityId: null } }),
            prisma.guider.updateMany({ where: { cityId: req.params.id }, data: { cityId: null } }),
            prisma.restaurant.updateMany({ where: { cityId: req.params.id }, data: { cityId: null } }),
            prisma.store.updateMany({ where: { cityId: req.params.id }, data: { cityId: null } }),
            prisma.scenicSpot.updateMany({ where: { cityId: req.params.id }, data: { cityId: null } })
          ]);
        }
        await prisma[modelName].delete({ where: { id: req.params.id } });
        res.status(204).send();
      } catch (err) {
        if (err.code === 'P2025') {
          return res.status(404).json({ message: '要删除的记录不存在' });
        }
        logger.error(`[CRUD delete ${modelName}] Error: ${err.message}`, { error: err });
        res.status(500).json({ message: '服务器内部错误，请稍后重试' });
      }
    },
    bulkDelete: async (req, res) => {
      try {
        const { ids } = req.body;
        if (!Array.isArray(ids) || ids.length === 0) {
          return res.status(400).json({ message: '请选择要删除的记录' });
        }
        await prisma[modelName].deleteMany({
          where: { id: { in: ids } }
        });
        res.status(204).send();
      } catch (err) {
        logger.error(`[CRUD bulkDelete ${modelName}] Error: ${err.message}`, { error: err });
        res.status(500).json({ message: '批量删除失败，请稍后重试' });
      }
    }
  };
};

const getSearchableFields = (modelName) => {
  const fields = {
    city: ['name'],
    driver: ['name', 'phone'],
    guider: ['name', 'phone'],
    restaurant: ['name', 'address'],
    store: ['name', 'address'],
    scenicSpot: ['name'],
    deliveryOrder: ['platformName', 'orderRef', 'passengerName'],
    vehicle: ['name', 'carPlatformName'],
    fleet: ['name', 'leader'],
    user: ['username']
  };
  return fields[modelName] || [];
};

const getIncludes = (modelName) => {
  const includes = {
    city: { drivers: true, guiders: true, restaurants: true, stores: true, scenicSpots: true },
    driver: { city: true, fleet: true },
    guider: { city: true },
    restaurant: { city: true },
    store: { city: true },
    scenicSpot: { city: true },
    deliveryOrder: { vehicle: true, driver: true, guider: true },
    fleet: { drivers: true }
  };
  return includes[modelName] || undefined;
};

const sanitizeSensitive = (modelName, data) => {
  if (!['driver', 'guider'].includes(modelName)) return data;
  if (Array.isArray(data)) {
    return data.map(item => {
      if (!item || typeof item !== 'object') return item;
      const { password, ...rest } = item;
      return rest;
    });
  }
  if (!data || typeof data !== 'object') return data;
  const { password, ...rest } = data;
  return rest;
};

module.exports = createCRUDController;
