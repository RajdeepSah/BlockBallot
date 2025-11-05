import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Vote } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8 md:p-12 text-center space-y-8">
        <div className="flex justify-center">
          <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center">
            <Vote className="h-10 w-10 text-primary-foreground" />
          </div>
        </div>
        
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">
            BlockBallot
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Secure, transparent, and tamper-proof elections powered by blockchain technology
          </p>
        </div>

        <div className="pt-4">
          <Button 
            size="lg" 
            className="text-lg px-8 py-6"
            onClick={() => navigate('/create-election')}
          >
            Organize an Election
          </Button>
        </div>

        <div className="pt-8 text-sm text-muted-foreground">
          <p>Built with blockchain smart contracts for maximum security and transparency</p>
        </div>
      </Card>
    </div>
  );
};

export default Landing;
