import { Dialog, DialogContent } from '@/components/ui/dialog';

interface LoadingOverlayProps {
  isOpen: boolean;
  message?: string;
}

export function LoadingOverlay({ isOpen, message = 'Loading...' }: LoadingOverlayProps) {
  return (
    <Dialog open={isOpen}>
      <DialogContent className="bg-dark-card/90 backdrop-blur-md border-gray-700 max-w-sm">
        <div className="flex flex-col items-center space-y-4 p-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-blue"></div>
          <p className="text-white font-medium text-center">{message}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
