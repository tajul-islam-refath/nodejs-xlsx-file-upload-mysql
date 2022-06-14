// Cache middleware
async function cache(req, res, next) {
  const value = await client.get("user-list");
  if (value) {
    return res.send(JSON.parse(value));
  } else {
    next();
  }
}

module.exports = cache;
