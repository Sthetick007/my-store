import { TabType } from '@/types';
import { cn } from '@/lib/utils';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  isAdmin: boolean;
}

export function TabNavigation({ activeTab, onTabChange, isAdmin }: TabNavigationProps) {
  const tabs = [
    { id: 'store' as TabType, label: 'Store', icon: 'fas fa-store' },
    { id: 'wallet' as TabType, label: 'Wallet', icon: 'fas fa-wallet' },
    { id: 'products' as TabType, label: 'My Products', icon: 'fas fa-box' },
    { id: 'settings' as TabType, label: 'Settings', icon: 'fas fa-cog' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-dark-glass backdrop-blur-md border-t border-gray-800 z-50">
      <div className="grid grid-cols-4 py-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex flex-col items-center py-2 px-4 transition-colors',
              activeTab === tab.id
                ? 'text-accent-blue'
                : 'text-gray-400 hover:text-white'
            )}
          >
            <i className={cn(tab.icon, 'text-lg mb-0.5')}></i>
            <span className="text-xs font-medium">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
