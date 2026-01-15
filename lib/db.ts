import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Product operations
export async function getAllProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getProductById(id: number) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function createProduct(
  name: string,
  description: string,
  price: number,
  imagePath: string | null
) {
  const { data, error } = await supabase
    .from('products')
    .insert({ name, description, price, image_path: imagePath })
    .select()
    .single();

  if (error) throw error;
  return { lastInsertRowid: data.id };
}

export async function deleteProduct(id: number) {
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

// Device verification operations
export async function isDeviceVerified(deviceId: string) {
  const { data, error } = await supabase
    .from('verified_devices')
    .select('*')
    .eq('device_id', deviceId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return !!data;
}

export async function getVerifiedDevice(deviceId: string) {
  const { data, error } = await supabase
    .from('verified_devices')
    .select('*')
    .eq('device_id', deviceId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function createPendingVerification(deviceId: string, code: string) {
  // Delete any existing pending verification for this device
  await supabase
    .from('pending_verifications')
    .delete()
    .eq('device_id', deviceId);

  const { error } = await supabase
    .from('pending_verifications')
    .insert({ device_id: deviceId, code });

  if (error) throw error;
}

export async function verifyCode(deviceId: string, code: string) {
  const { data, error } = await supabase
    .from('pending_verifications')
    .select('*')
    .eq('device_id', deviceId)
    .eq('code', code)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return !!data;
}

export async function completeVerification(
  deviceId: string,
  name: string,
  phone: string
) {
  // Delete pending verification
  await supabase
    .from('pending_verifications')
    .delete()
    .eq('device_id', deviceId);

  // Upsert verified device
  const { error } = await supabase.from('verified_devices').upsert(
    { device_id: deviceId, name, phone },
    { onConflict: 'device_id' }
  );

  if (error) throw error;
}

// Inquiry operations
export async function createInquiry(
  customerName: string,
  customerPhone: string,
  productName: string,
  productId: number
) {
  const { error } = await supabase.from('inquiries').insert({
    customer_name: customerName,
    customer_phone: customerPhone,
    product_name: productName,
    product_id: productId,
  });

  if (error) throw error;
}

export async function getAllInquiries() {
  const { data, error } = await supabase
    .from('inquiries')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function deleteInquiry(id: number) {
  const { error } = await supabase.from('inquiries').delete().eq('id', id);
  if (error) throw error;
}

// Owner message/inbox operations
export async function createOwnerMessage(
  type: 'verification' | 'inquiry',
  title: string,
  content: string,
  metadata?: Record<string, unknown>
) {
  const { error } = await supabase.from('owner_messages').insert({
    type,
    title,
    content,
    metadata: metadata ? JSON.stringify(metadata) : null,
  });

  if (error) throw error;
}

export async function getAllOwnerMessages() {
  const { data, error } = await supabase
    .from('owner_messages')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getUnreadMessageCount() {
  const { count, error } = await supabase
    .from('owner_messages')
    .select('*', { count: 'exact', head: true })
    .eq('is_read', false);

  if (error) throw error;
  return count || 0;
}

export async function markMessageAsRead(id: number) {
  const { error } = await supabase
    .from('owner_messages')
    .update({ is_read: true })
    .eq('id', id);

  if (error) throw error;
}

export async function markAllMessagesAsRead() {
  const { error } = await supabase
    .from('owner_messages')
    .update({ is_read: true })
    .eq('is_read', false);

  if (error) throw error;
}

export async function deleteOwnerMessage(id: number) {
  const { error } = await supabase.from('owner_messages').delete().eq('id', id);
  if (error) throw error;
}

// Image upload helper using Supabase Storage
export async function uploadProductImage(
  file: Buffer,
  filename: string
): Promise<string> {
  const { error } = await supabase.storage
    .from('product-images')
    .upload(filename, file, {
      contentType: 'image/*',
      upsert: false,
    });

  if (error) throw error;

  const { data } = supabase.storage
    .from('product-images')
    .getPublicUrl(filename);

  return data.publicUrl;
}

export async function deleteProductImage(filename: string) {
  const { error } = await supabase.storage
    .from('product-images')
    .remove([filename]);

  if (error) throw error;
}
