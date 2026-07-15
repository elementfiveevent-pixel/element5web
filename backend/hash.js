const bcrypt = require("bcrypt");
const password = "Element5AdminSecure2026!";
bcrypt.hash(password, 10).then(hash => {
  console.log("\n==================================================");
  console.log("Copy this hash for your SQL query:");
  console.log(hash);
  console.log("==================================================\n");
});
