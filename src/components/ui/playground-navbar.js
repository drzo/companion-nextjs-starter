import Link from "next/link";
import { Home, MessageSquare, Settings, Baby as Lab } from "lucide-react";

export function PlaygroundNavbar() {
  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-gray-900 border-t border-gray-800 flex justify-center items-center">
      <div className="flex space-x-8">
        <NavLink href="/" icon={<Home className="w-5 h-5" />} label="Home" />
        <NavLink 
          href="/playground" 
          icon={<Lab className="w-5 h-5" />} 
          label="Playground" 
          active
        />
      </div>
    </div>
  );
}

function NavLink({ href, icon, label, active }) {
  return (
    <Link 
      href={href} 
      className={`flex flex-col items-center text-sm ${
        active ? "text-blue-500" : "text-gray-400 hover:text-white"
      }`}
    >
      {icon}
      <span className="mt-1">{label}</span>
    </Link>
  );
}