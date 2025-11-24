import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';

interface AdminAccessButtonProps {
  onAccessAdmin: () => void;
}

export const AdminAccessButton = ({ onAccessAdmin }: AdminAccessButtonProps) => {
  return (
    <Button
      onClick={onAccessAdmin}
      className="fixed bottom-6 right-6 z-50 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
    >
      <Shield className="h-5 w-5 mr-2" />
      Admin Panel
    </Button>
  );
};
