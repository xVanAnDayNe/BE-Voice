const userService = require("../services/person.service");

exports.createGuestUser = async (req, res) => {
  const user = await userService.createGuest(req.body);
  res.json({ message: "Guest(User) create sucessfully",guestId: user.PersonID });
};

exports.getAll = async (req, res) => {
    const users = await userService.getUsers();
    res.json(users);
};


