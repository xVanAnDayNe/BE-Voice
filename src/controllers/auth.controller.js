const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Person = require("../models/person");

exports.login = async (req, res) => {
  try {
    const { username, password, email, gmail } = req.body;

    // If email provided, try volunteer login by email (no password)
    const providedEmail = (email || gmail || "").toString().trim().toLowerCase();

    if (providedEmail) {
      const adminEmail = (process.env.ADMIN_USERNAME || "").toString().trim().toLowerCase();
      const managerEmail = (process.env.MANAGER_USERNAME || "").toString().trim().toLowerCase();

      // If provided email matches admin or manager env, treat as admin/manager login
      if (providedEmail === adminEmail || providedEmail === managerEmail) {
        if (!password) return res.status(401).json({ message: "Password required" });

        let role = null;
        let passwordHash = null;
        let message = null;
        if (providedEmail === adminEmail) {
          role = "Admin";
          passwordHash = process.env.ADMIN_PASSWORD_HASH;
          message = "Login admin success";
        } else {
          role = "Manager";
          passwordHash = process.env.MANAGER_PASSWORD_HASH;
          message = "Login manager success";
        }

        const isMatch = await bcrypt.compare(password, passwordHash);
        if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

        const token = jwt.sign(
          {
            role,
            username: providedEmail
          },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
        );

        return res.json({ message, token, role });
      }
      const user = await Person.findOne({ email: providedEmail }).select("+password");
      if (!user || user.role !== "Volunteer") {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      if (!password) {
        return res.status(401).json({ message: "Password required" });
      }
      if (!user.password) {
        return res.status(401).json({ message: "Password required" });
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign(
        {
          role: "Volunteer",
          userId: user._id,
          name: user.name,
          email: user.email
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
      );

      return res.json({
        message: "Login success",
        token,
        role: "Volunteer"
      });
    }

    const { username: uname, password: pwd } = req.body;
    const usernameVal = uname || username;
    const passwordVal = pwd || password;

    const usernameToCheck = usernameVal;

    let role, passwordHash, message;

    // Kiểm tra xem username có phải admin hay manager
    if (usernameToCheck === process.env.ADMIN_USERNAME) {
      role = "Admin";
      passwordHash = process.env.ADMIN_PASSWORD_HASH;
      message = "Login admin success";
    } else if (usernameToCheck === process.env.MANAGER_USERNAME) {
      role = "Manager";
      passwordHash = process.env.MANAGER_PASSWORD_HASH;
      message = "Login manager success";
    } else {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const isMatch = await bcrypt.compare(passwordVal, passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign(
      {
        role,
        username: usernameToCheck
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
    );

    return res.json({
      message,
      token,
      role
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};
