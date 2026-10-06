// Wires release signing into the Tauri-generated Android project (run in CI after `tauri android init`).
// Reads ANDROID_KEYSTORE_PATH, ANDROID_KEYSTORE_PASSWORD, ANDROID_KEY_ALIAS from the environment.
import { readFileSync, writeFileSync } from 'node:fs';

const { ANDROID_KEYSTORE_PATH, ANDROID_KEYSTORE_PASSWORD, ANDROID_KEY_ALIAS } = process.env;
if (!ANDROID_KEYSTORE_PATH || !ANDROID_KEYSTORE_PASSWORD || !ANDROID_KEY_ALIAS) {
  console.error('Missing ANDROID_KEYSTORE_PATH / ANDROID_KEYSTORE_PASSWORD / ANDROID_KEY_ALIAS');
  process.exit(1);
}

const root = 'src-tauri/gen/android';
writeFileSync(
  `${root}/keystore.properties`,
  `storeFile=${ANDROID_KEYSTORE_PATH}\npassword=${ANDROID_KEYSTORE_PASSWORD}\nkeyAlias=${ANDROID_KEY_ALIAS}\n`,
);

const gradlePath = `${root}/app/build.gradle.kts`;
let gradle = readFileSync(gradlePath, 'utf8');
if (gradle.includes('signingConfigs')) {
  console.log('Signing already configured');
  process.exit(0);
}

const signing = `
    signingConfigs {
        create("release") {
            val keystoreProperties = java.util.Properties()
            keystoreProperties.load(java.io.FileInputStream(rootProject.file("keystore.properties")))
            keyAlias = keystoreProperties["keyAlias"] as String
            keyPassword = keystoreProperties["password"] as String
            storeFile = file(keystoreProperties["storeFile"] as String)
            storePassword = keystoreProperties["password"] as String
            storeType = "pkcs12"
        }
    }`;

const before = gradle;
gradle = gradle.replace(/^android \{/m, (m) => m + signing);
gradle = gradle.replace(/getByName\("release"\) \{/, (m) => `${m}\n            signingConfig = signingConfigs.getByName("release")`);
if (gradle === before || !gradle.includes('signingConfig = signingConfigs')) {
  console.error('Could not patch build.gradle.kts; layout changed?');
  process.exit(1);
}
writeFileSync(gradlePath, gradle);
console.log('Release signing configured');
