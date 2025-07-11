import { useAuth } from '@/hooks/useAuth';
import { useTelegram } from '@/hooks/useTelegram';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function Header() {
  const { user: authUser } = useAuth();
  const { user: telegramUser } = useTelegram();

  const displayName = authUser?.firstName || telegramUser?.first_name || 'User';
  const username = authUser?.username || telegramUser?.username;
  const avatarUrl = authUser?.photoUrl || telegramUser?.photo_url;
  const balance = authUser?.balance || '0.00';

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-dark-glass border-b border-gray-800 w-full">
      <div className="px-4 py-3 max-w-screen-xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <Avatar className="w-10 h-10 shrink-0">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback className="bg-gradient-to-r from-accent-blue to-purple-500 text-white">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h1 className="text-sm font-semibold text-white truncate">{displayName}</h1>
              {username && <p className="text-xs text-gray-400 truncate">@{username}</p>}
            </div>
          </div>
          <div className="flex items-center space-x-3 shrink-0">
            <div className="text-right">
              <div className="flex items-center space-x-2">
                <i className="fas fa-wallet text-accent-blue text-sm"></i>
                <span className="text-lg font-bold text-white">${balance}</span>
              </div>
              <p className="text-xs text-gray-400">Available Balance</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
