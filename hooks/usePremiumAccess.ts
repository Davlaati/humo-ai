
import { UserProfile } from '../types';
import { useUserStore } from '../store/userStore';

export const usePremiumAccess = (user: UserProfile | null) => {
  const isPremium = useUserStore((state) => state.isPremiumActive);
  
  const checkAccess = () => {
    if (!isPremium) {
      alert("Ushbu funksiyadan foydalanish uchun Premium xarid qiling!");
      return false;
    }
    return true;
  };

  return { isPremium, checkAccess };
};
