# AV COOLING SYSTEM (MERN, mock data, 3-layer MVC)

Run:
  cd server && npm install && npm start      # http://localhost:5000
  cd client && npm install && npm run dev     # http://localhost:5173

Architecture (server):
  routes -> controllers (HTTP / "C") -> services (business logic, 2nd layer)
         -> repositories (data access over in-memory mock data, 3rd layer)
  data/mockData.js = the "models"/seed data. Swap repositories for Mongoose later; nothing above changes.

Demo logins (password for all: Password123!)  [passwords are bcrypt-hashed at startup, not stored in code]
  admin@av.test  manager@av.test  ecom@av.test  cashier@av.test  inventory@av.test  tech@av.test  customer@av.test
Data resets on server restart.
