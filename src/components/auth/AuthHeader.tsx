
import InteractiveLogo from "@/components/InteractiveLogo";

const AuthHeader = () => {
  return (
    <div className="flex items-center gap-3 mb-12">
      <InteractiveLogo 
        src="/images/Logo.png" 
        alt="Adviseek Logo" 
        className="h-10 w-10 rounded-full overflow-hidden" 
      />
      <h1 className="font-bold text-xl">Adviseek<span className="text-accent">.SG</span></h1>
    </div>
  );
};

export default AuthHeader;
