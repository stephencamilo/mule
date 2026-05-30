import express from 'express';
import { globalViewData } from './middleware/globals.js';
import apiRouter from './controllers/apiController.js';
import * as adminController from './controllers/adminController.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'pug');

app.use(globalViewData);

app.use('/api', apiRouter);

app.get('/', (req, res) => res.redirect('/admin/content_type'));
app.get('/admin', (req, res) => res.redirect('/admin/content_type'));

// Admin parameterised routes – the only admin routes
app.get('/admin/:entity',               adminController.index());
app.get('/admin/:entity/new',           adminController.newForm());
app.post('/admin/:entity/create',       adminController.create());
app.get('/admin/:entity/edit/:id',      adminController.edit());
app.post('/admin/:entity/update/:id',   adminController.update());
app.get('/admin/:entity/delete/:id',    adminController.deleteConfirm());
app.post('/admin/:entity/delete/:id',   adminController.deleteEntity());

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});