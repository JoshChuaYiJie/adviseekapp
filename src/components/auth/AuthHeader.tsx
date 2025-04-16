
import InteractiveLogo from "@/components/InteractiveLogo";

const AuthHeader = () => {
  return (
    <div className="flex items-center gap-3 mb-12">
      <InteractiveLogo 
        src="/lovable-uploads/91e13e22-0c4e-4bb8-be3b-a16cac3f5b22.png" 
        alt="Adviseek Logo" 
        className="h-10 w-10 rounded-full overflow-hidden" 
      />
      <h1 className="font-bold text-xl">Adviseek<span className="text-accent">.SG</span></h1>
    </div>
  );
};

export default AuthHeader;
