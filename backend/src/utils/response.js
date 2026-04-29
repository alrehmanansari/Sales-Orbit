const ok = (res, data = {}, message = 'Success', status = 200) =>
  res.status(status).json({ success: true, message, ...data });

const created = (res, data = {}, message = 'Created') =>
  ok(res, data, message, 201);

const badRequest = (res, message = 'Bad request') =>
  res.status(400).json({ success: false, message });

const unauthorized = (res, message = 'Unauthorized') =>
  res.status(401).json({ success: false, message });

const notFound = (res, message = 'Not found') =>
  res.status(404).json({ success: false, message });

module.exports = { ok, created, badRequest, unauthorized, notFound };
