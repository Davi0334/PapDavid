import { getProfile as getFirestoreProfile, updateProfile as updateFirestoreProfile, Profile } from './firestore';
import { updatePassword as firebaseUpdatePassword } from 'firebase/auth';
import { auth } from './firebase';

export type { Profile } from './firestore';

export async function getProfile() {
  try {
    return await getFirestoreProfile();
  } catch (error) {
    console.error('Error getting profile:', error);
    throw error;
  }
}

export async function updateProfile(updates: Partial<Profile>) {
  try {
    return await updateFirestoreProfile(updates);
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
}

export async function updatePassword(password: string) {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');
    
    await firebaseUpdatePassword(user, password);
  } catch (error) {
    console.error('Error updating password:', error);
    throw error;
  }
}