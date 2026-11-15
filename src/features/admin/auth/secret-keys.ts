import { Client } from "@/features/admin/models/client";
import { createClientDataKey, unwrapClientDataKey } from "@/features/admin/auth/encryption";

export async function getClientWithKey(id: string) {
  const client = await Client.findById(id).select("+encryptedDataKey +dataKeyIv +dataKeyAuthTag +dataKeyVersion");
  if (!client) return null;
  if (!client.encryptedDataKey || !client.dataKeyIv || !client.dataKeyAuthTag || !client.dataKeyVersion) {
    const dataKey = createClientDataKey();
    client.encryptedDataKey = dataKey.wrapped.ciphertext;
    client.dataKeyIv = dataKey.wrapped.iv;
    client.dataKeyAuthTag = dataKey.wrapped.authTag;
    client.dataKeyVersion = dataKey.wrapped.keyVersion;
    await client.save();
    return { client, key: dataKey.key };
  }
  return {
    client,
    key: unwrapClientDataKey({
      ciphertext: client.encryptedDataKey,
      iv: client.dataKeyIv,
      authTag: client.dataKeyAuthTag,
      keyVersion: client.dataKeyVersion,
    }),
  };
}
