require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const auth = require('./middleware/auth');
const { login } = require('./controllers/authController');
const { getStats } = require('./controllers/statsController');
const { getSystemInfo } = require('./controllers/systemInfoController');
const { getAMapConfig } = require('./controllers/configController');
const createCRUDController = require('./controllers/crudController');

const logger = require('./logger');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Log requests
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Public routes
app.post('/api/login', login);

// Stats route
app.get('/api/stats', auth, getStats);
app.get('/api/system-info', auth, getSystemInfo);
app.get('/api/amap-config', auth, getAMapConfig);

// Protected routes
const modules = [
  { path: 'cities', model: 'city' },
  { path: 'drivers', model: 'driver' },
  { path: 'guiders', model: 'guider' },
  { path: 'restaurants', model: 'restaurant' },
  { path: 'stores', model: 'store' },
  { path: 'vehicles', model: 'vehicle' },
  { path: 'delivery-orders', model: 'deliveryOrder' },
  { path: 'fleets', model: 'fleet' },
  { path: 'users', model: 'user' }
];

modules.forEach(m => {
  const controller = createCRUDController(m.model);
  const router = express.Router();
  router.use(auth);
  router.get('/', controller.getAll);
  router.get('/:id', controller.getOne);
  router.post('/', controller.create);
  router.put('/:id', controller.update);
  router.delete('/bulk', controller.bulkDelete);
  router.delete('/:id', controller.delete);
  app.use(`/api/${m.path}`, router);
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
