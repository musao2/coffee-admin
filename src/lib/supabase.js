import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseConfigured = Boolean(url && key)

// Admin sessiyasi mijoz/kassa ilovasidan alohida saqlanadi
export const supabase = createClient(url || 'http://localhost:54321', key || 'missing-anon-key', {
  auth: { persistSession: true, autoRefreshToken: true, storageKey: 'bean-back-admin' },
})

// Yangi kassir yaratish uchun: adminning o'z sessiyasiga tegmaydigan alohida klient
export const createSignupClient = () =>
  createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, storageKey: 'bean-back-signup' } })
