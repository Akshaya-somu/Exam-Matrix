const forge = require("node-forge");
const fs = require("fs");
const path = require("path");

console.log("Generating self-signed SSL certificate...");

// Generate a key pair
const keys = forge.pki.rsa.generateKeyPair(2048);

// Create a certificate
const cert = forge.pki.createCertificate();
cert.publicKey = keys.publicKey;
cert.serialNumber = "01";
cert.validity.notBefore = new Date();
cert.validity.notAfter = new Date();
cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

const attrs = [
  { name: "commonName", value: "10.103.35.34" },
  { name: "countryName", value: "US" },
  { shortName: "ST", value: "State" },
  { name: "localityName", value: "City" },
  { name: "organizationName", value: "Exam Matrix" },
  { shortName: "OU", value: "Development" },
];

cert.setSubject(attrs);
cert.setIssuer(attrs);

cert.setExtensions([
  {
    name: "basicConstraints",
    cA: true,
  },
  {
    name: "keyUsage",
    keyCertSign: true,
    digitalSignature: true,
    nonRepudiation: true,
    keyEncipherment: true,
    dataEncipherment: true,
  },
  {
    name: "subjectAltName",
    altNames: [
      {
        type: 7, // IP
        ip: "10.103.35.34",
      },
      {
        type: 2, // DNS
        value: "localhost",
      },
    ],
  },
]);

// Self-sign certificate
cert.sign(keys.privateKey, forge.md.sha256.create());

// Convert to PEM format
const pemCert = forge.pki.certificateToPem(cert);
const pemKey = forge.pki.privateKeyToPem(keys.privateKey);

// Save to files
const certsDir = path.join(__dirname, "certs");

if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir, { recursive: true });
}

fs.writeFileSync(path.join(certsDir, "server.crt"), pemCert);
fs.writeFileSync(path.join(certsDir, "server.key"), pemKey);

console.log("✓ SSL certificate generated successfully!");
console.log("  Certificate: certs/server.crt");
console.log("  Private Key: certs/server.key");
console.log("\nNow restart the server with: npm run dev");
