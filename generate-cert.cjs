const pem = require("pem");
const fs = require("fs");
const path = require("path");

console.log("Generating self-signed certificate...");

pem.createCertificate(
  {
    days: 365,
    selfSigned: true,
    altNames: ["10.103.35.34", "localhost"],
    commonName: "10.103.35.34",
  },
  (err, keys) => {
    if (err) {
      console.error("Error generating certificate:", err);
      process.exit(1);
    }

    const certsDir = path.join(__dirname, "certs");

    if (!fs.existsSync(certsDir)) {
      fs.mkdirSync(certsDir, { recursive: true });
    }

    fs.writeFileSync(path.join(certsDir, "server.key"), keys.serviceKey);
    fs.writeFileSync(path.join(certsDir, "server.crt"), keys.certificate);

    console.log("✓ SSL certificate generated successfully!");
    console.log("  Certificate: certs/server.crt");
    console.log("  Private Key: certs/server.key");
  }
);
