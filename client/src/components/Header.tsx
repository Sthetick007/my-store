import { useAuth } from '@/hooks/useAuth';
import { useTelegram } from '@/hooks/useTelegram';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onAdminToggle?: () => void;
  showAdminSwitch?: boolean;
}

export function Header({ onAdminToggle, showAdminSwitch }: HeaderProps = {}) {
  const { user: authUser } = useAuth();
  const { user: telegramUser } = useTelegram();

  const displayName = authUser?.firstName || telegramUser?.first_name || 'User';
  const username = authUser?.username || telegramUser?.username || 'user';
  const avatarUrl = authUser?.profileImageUrl || telegramUser?.photo_url;
  const balance = authUser?.balance || '0.00';
  const isAdmin = authUser?.isAdmin;

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-dark-glass border-b border-gray-800">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback className="bg-gradient-to-r from-accent-blue to-purple-500 text-white">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-sm font-semibold text-white">{displayName}</h1>
              <p className="text-xs text-gray-400">@{username}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {isAdmin && showAdminSwitch && (
              <Button
                size="sm"
                variant="outline"
                onClick={onAdminToggle}
                className="bg-red-500/20 border-red-500/30 text-red-400 hover:bg-red-500/30 text-xs px-2 py-1"
              >
                <i className="fas fa-shield-alt mr-1"></i>
                Admin
              </Button>
            )}
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
