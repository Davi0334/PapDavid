import { Link } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, WifiOff } from 'lucide-react';

const Home = () => {
  const user = true; // Replace with actual user authentication logic
  const isAdmin = true; // Replace with actual admin check logic

  return (
    <div>
      {user && (
        <div className={`fixed ${isAdmin ? 'bottom-36' : 'bottom-20'} right-6`}>
          <div className="flex flex-col gap-2">
            <Link to="/criar-grupo">
              <Button 
                size="icon" 
                className="bg-primary text-white rounded-full h-14 w-14 shadow-lg hover:bg-primary/90 z-50"
              >
                <PlusCircle className="h-8 w-8" />
              </Button>
            </Link>
            
            <Link to="/criar-grupo-offline">
              <Button 
                size="icon" 
                className="bg-yellow-500 text-white rounded-full h-14 w-14 shadow-lg hover:bg-yellow-600 z-50"
                title="Criar grupo em modo offline (quando houver problemas de conexão)"
              >
                <WifiOff className="h-6 w-6" />
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home; 