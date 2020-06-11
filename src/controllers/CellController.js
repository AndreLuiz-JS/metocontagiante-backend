require('dotenv/config');
const connection = require("../database/connection");
const axios = require('axios');

module.exports = {
  async index(request, response) {
    const { geolocation } = request.params;
    const cells = await connection("cells").select("*").orderBy("name");
    if (!geolocation) return response.json(cells);

    const [ userLatitudeString, userLongitudeString ] = geolocation.split(',');
    const userLatitude = Number(userLatitudeString);
    const userLongitude = Number(userLongitudeString);
    const cellsOrdered = [];
    for (let cell of cells) {
      const { latitude, longitude } = cell;
      const distance = calculateDistance({ lat: userLatitude, long: userLongitude }, { lat: latitude, long: longitude });
      cellsOrdered.push({ ...cell, distance });
    }
    cellsOrdered.sort((a, b) => a.distance - b.distance);

    return response.json(cellsOrdered);


    function calculateDistance(location1, location2) {
      const earthRadius = 6371e3;
      if (typeof (location1.lat) !== "number"
        || typeof (location1.long) !== "number"
        || typeof (location2.lat) !== "number"
        || typeof (location2.long) !== "number"
      ) return earthRadius;

      const φ1 = location1.lat * Math.PI / 180;
      const φ2 = location2.lat * Math.PI / 180;
      const Δφ = (location2.lat - location1.lat) * Math.PI / 180;
      const Δλ = (location2.long - location1.long) * Math.PI / 180;

      const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      const distance = earthRadius * c;

      return distance;
    }
  },
  async create(req, res) {
    const { userId } = req;
    const {
      image,
      name,
      leader,
      phone,
      location,
      weekday,
      hour,
      type,
    } = req.body;
    const user = await connection("users")
      .innerJoin("users_access", "users.access_level", "users_access.level")
      .select("name", "access_level", "email", "user_type")
      .where("id", userId)
      .first();
    if (image.lenght > 300)
      return res.status(403).json({ error: "Image must be 300k or lower" });
    const { level: administrator_level } = await connection("users_access")
      .select("level")
      .where("user_type", "administrator_user")
      .first();
    if (user.access_level < administrator_level)
      return res.status(403).json({ error: "No rights to add new cell." });
    if (user.access_level >= administrator_level) {
      const url = encodeURI(`https://maps.googleapis.com/maps/api/geocode/json?address=${location}, São Pedro da Aldeia - RJ&key=${process.env.GOOGLE_GEOCODE_API_SECRET}`);
      const { data } = await axios.get(url);
      const [ result ] = data.results;
      const { lat: latitude, lng: longitude } = result.geometry.location
      const cell = await connection("cells").insert({
        image,
        name,
        leader,
        phone,
        location,
        weekday,
        hour,
        type,
        latitude,
        longitude
      });
      return res.json(cell);
    }
  },
  async edit(req, res) {
    const { userId } = req;
    const {
      image,
      name,
      leader,
      phone,
      location,
      weekday,
      hour,
      type,
    } = req.body;
    const { id } = req.params;
    const user = await connection("users")
      .innerJoin("users_access", "users.access_level", "users_access.level")
      .select("name", "access_level", "email", "user_type")
      .where("id", userId)
      .first();

    const { level: administrator_level } = await connection("users_access")
      .select("level")
      .where("user_type", "administrator_user")
      .first();

    if (user.access_level < administrator_level)
      return res.status(403).json({ error: "No rights to change cell." });

    if (user.access_level >= administrator_level) {
      const url = encodeURI(`https://maps.googleapis.com/maps/api/geocode/json?address=${location}, São Pedro da Aldeia - RJ&key=${process.env.GOOGLE_GEOCODE_API_SECRET}`);
      const { data } = await axios.get(url);
      const [ result ] = data.results;
      const { lat: latitude, lng: longitude } = result.geometry.location
      const cell = await connection("cells")
        .update({
          image,
          name,
          leader,
          phone,
          location,
          weekday,
          hour,
          type,
          latitude,
          longitude
        })
        .where("id", id);
      return res.json(cell);
    }
  },
  async delete(req, res) {
    const { userId } = req;
    const { id } = req.params;
    if (!id) return res.status(404).json({ error: "No id provided." });
    const user = await connection("users")
      .innerJoin("users_access", "users.access_level", "users_access.level")
      .select("name", "access_level", "email", "user_type")
      .where("id", userId)
      .first();
    if (!user) return res.status(403).json({ error: "Invalid credentials." });
    const { level: administrator_level } = await connection("users_access")
      .select("level")
      .where("user_type", "administrator_user")
      .first();

    if (user.access_level < administrator_level)
      return res.status(403).json({ error: "No rights to delete cell." });

    const cell = await connection("cells").delete().where("id", id);
    if (cell === 1) return res.json({ info: "Cell deleted." });

    return res.status(404).json({ error: "Cell not found." });
  },
};
