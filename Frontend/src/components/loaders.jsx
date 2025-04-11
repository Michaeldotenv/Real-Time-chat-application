import { Loader2 } from "lucide-react"; // Lucide's spinner icon

const Preloader1 = () => {
  return (
    <div className="bg-gray-800 fixed inset-0 flex items-center justify-center backdrop-blur-sm z-50">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-gray-100" />
        <span className="text-sm font-medium text-gray-100">loading...</span>
      </div>
    </div>
  );
};

export default Preloader1;