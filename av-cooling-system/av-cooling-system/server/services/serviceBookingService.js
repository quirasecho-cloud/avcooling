const db = require('../repositories/db');
const audit = require('./audit');
const err = (m, s = 400) => Object.assign(new Error(m), { status: s });
const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const overlap = (a, b) => a.start < b.end && b.start < a.end;
exports.isAvailable = (svc, date, time, technicianId, ignoreId) => {
  if (!date || !/^\d\d:\d\d$/.test(time || '')) return false;
  const { workStart, workEnd } = db.data.settings; const w = { start: toMin(time), end: toMin(time) + svc.durationMin };
  if (new Date(date) < new Date(new Date().toDateString())) return false;
  if (w.start < toMin(workStart) || w.end > toMin(workEnd)) return false;
  const techs = technicianId ? [technicianId] : db.users.where(u => u.role === 'technician' && u.active).map(u => u.id);
  const busy = tid => db.appointments.where(a => a.id !== ignoreId && a.status !== 'Cancelled' && a.technicianId === tid && a.date === date && overlap(w, { start: toMin(a.time), end: toMin(a.time) + a.durationMin })).length;
  if (technicianId) return !busy(technicianId);
  // unassigned requests also consume capacity: free techs must exceed unassigned overlapping requests
  const unassigned = db.appointments.where(a => a.id !== ignoreId && a.status === 'Requested' && !a.technicianId && a.date === date && overlap(w, { start: toMin(a.time), end: toMin(a.time) + a.durationMin })).length;
  return techs.filter(t => !busy(t)).length > unassigned;
};
exports.book = (user, b) => {
  const svc = db.services.find(b.serviceId); if (!svc || !svc.active) throw err('Service not found.');
  if (!b.date || !b.time || !b.address) throw err('Date, time and address are required.');
  if (!exports.isAvailable(svc, b.date, b.time)) throw err('Selected schedule is unavailable. Please choose another schedule.', 409);
  const a = db.appointments.insert({ customerId: user.id, serviceId: svc.id, serviceName: svc.name, durationMin: svc.durationMin, acUnit: b.acUnit, problem: b.problem, address: b.address, date: b.date, time: b.time, notes: b.notes, technicianId: null, status: 'Requested' });
  audit.notifyRole('manager', `New service request: ${svc.name} on ${b.date}`); audit.notify(user.id, 'Service booking received.'); return a;
};
exports.assign = (user, id, technicianId) => {
  const a = db.appointments.find(id); if (!a) throw err('Appointment not found.', 404);
  const t = db.users.find(technicianId); if (!t || t.role !== 'technician') throw err('Invalid technician.');
  if (!exports.isAvailable({ durationMin: a.durationMin }, a.date, a.time, t.id, a.id)) throw err('Technician has a conflicting appointment.', 409);
  db.appointments.update(id, { technicianId: t.id, status: 'Assigned' });
  audit.log(user, 'ASSIGN', 'appointments', `${a.serviceName} -> ${t.name}`, a.id); audit.notify(t.id, 'New service job assigned.'); audit.notify(a.customerId, 'Technician assigned to your booking.'); return a;
};
exports.reschedule = (user, id, date, time) => {
  const a = db.appointments.find(id); if (!a) throw err('Appointment not found.', 404);
  if (!exports.isAvailable({ durationMin: a.durationMin }, date, time, a.technicianId || undefined, a.id)) throw err('Selected schedule is unavailable. Please choose another schedule.', 409);
  db.appointments.update(id, { date, time }); audit.log(user, 'RESCHEDULE', 'appointments', `${a.serviceName} ${date} ${time}`, a.id); return a;
};
exports.setStatus = (user, id, status, notes) => {
  const a = db.appointments.find(id); if (!a) throw err('Appointment not found.', 404);
  if (!['Requested','Assigned','In Progress','Completed','Cancelled'].includes(status)) throw err('Invalid status.');
  const isTech = user.role === 'technician', isCust = user.role === 'customer';
  if (isTech && (a.technicianId !== user.id || !['In Progress','Completed'].includes(status))) throw err('Unauthorized access.', 403);
  if (isCust && (a.customerId !== user.id || status !== 'Cancelled')) throw err('Unauthorized access.', 403);
  if (!isTech && !isCust && !require('../middleware/auth').can(user, 'manage_appointments')) throw err('Unauthorized access.', 403);
  db.appointments.update(id, { status, techNotes: notes === undefined ? a.techNotes : notes });
  audit.log(user, 'STATUS', 'appointments', `${a.serviceName} -> ${status}`, a.id); audit.notify(a.customerId, `Service ${status}.`); return a;
};
exports.listFor = user => db.appointments.where(a => user.role === 'customer' ? a.customerId === user.id : user.role === 'technician' ? a.technicianId === user.id : true);
