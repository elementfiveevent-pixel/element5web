const bcrypt = require("bcrypt");

async function run() {
  const hash1 = await bcrypt.hash("Element5AdminSecure2026!", 10);
  const hash2 = await bcrypt.hash("Element5CreatorPass2026!", 10);
  
  console.log("Super Admin Hash:", hash1);
  console.log("Organizer/Artist Hash:", hash2);
}

run();
