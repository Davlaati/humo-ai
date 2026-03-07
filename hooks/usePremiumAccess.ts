
import { UserProfile } from '../types';
import { isPremiumActive } from './storageService';

export const usePremiumAccess = (user: UserProfile | null) => {
  const isPremium = user ? isPremiumActive(user) : false;
  
  const checkAccess = () => {
    if (!isPremium) {
      alert("Ushbu funksiyadan foydalanish uchun Premium xarid qiling!");
      return false;
    }
    return true;
  };

  return { isPremium, checkAccess };
};
