const express = require('express'), cors = require('cors');
const app = express();
app.use(cors({ origin: 'http://localhost:5173' })); app.use(express.json());
app.use('/api', require('./routes'));
app.use((e, req, res, next) => { if (!e.status) console.error(e); res.status(e.status || 500).json({ message: e.status ? e.message : 'Something went wrong.' }); });
app.listen(5000, () => console.log('API on http://localhost:5000'));
