import { betterAuth } from 'better-auth';

import { getAllConfigs } from '@/shared/models/config';

import { getAuthOptions } from './config';

// get auth instance in server side
export async function getAuth() {
  try {
    const configs = await getAllConfigs();
    const authOptions = await getAuthOptions(configs);
    return betterAuth(authOptions);
  } catch (error: any) {
    console.error('[Auth] getAuth error:', error);
    throw error;
  }
}
