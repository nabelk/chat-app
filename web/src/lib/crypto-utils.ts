export async function encryptMessage(
  message: string,
  key: CryptoKey
): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    new TextEncoder().encode(message)
  );

  const encryptedB64 = btoa(String.fromCharCode(...new Uint8Array(encrypted)));
  const ivB64 = btoa(String.fromCharCode(...iv));
  return `${encryptedB64}|${ivB64}`;
}

export async function decryptMessage(
  encryptedWithIv: string,
  key: CryptoKey
): Promise<string> {
  if (!encryptedWithIv.includes("|")) {
    // Assume it's plain text
    return encryptedWithIv;
  }
  const parts = encryptedWithIv.split("|");
  if (parts.length !== 2) {
    // Invalid format, return as is
    return encryptedWithIv;
  }
  const [encryptedB64, ivB64] = parts;
  try {
    const encryptedData = Uint8Array.from(atob(encryptedB64), (c) =>
      c.charCodeAt(0)
    );
    const ivData = Uint8Array.from(atob(ivB64), (c) => c.charCodeAt(0));

    const decrypted = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: ivData,
      },
      key,
      encryptedData
    );

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    // Decryption failed, return original
    console.error("Decryption failed:", error);
    return encryptedWithIv;
  }
}

export async function deriveDeterministicConversationKey(
  userIdA: string,
  userIdB: string,
  conversationId: string
): Promise<CryptoKey> {
  // Sort user IDs for consistency
  const [user1, user2] = [userIdA, userIdB].sort();

  // Create deterministic key material
  const keyMaterial = `${user1}:${user2}:${conversationId}:e2e`;

  // Import as raw key for PBKDF2
  const baseKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(keyMaterial),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  // Derive AES key with fixed parameters for determinism
  return await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: new Uint8Array(16).fill(0), // Fixed salt
      iterations: 100000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}
