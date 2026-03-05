import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import { ThemeToggle } from './theme-toggle';

export default function Navbar() {
    return (
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">

                {/* Left Section */}
                <div className="flex items-center gap-6">
                    <Link to="/" className="flex items-center gap-2 font-serif text-lg md:text-xl font-medium tracking-tight">
                        <span>Gesix</span>
                    </Link>
                </div>

                {/* Center/Right Section */}
                <div className="flex items-center gap-3 md:gap-6">
                    <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                        <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">Home</Link>
                        <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>
                    </nav>

                    <div className="h-5 w-px bg-border hidden md:block" />

                    <ThemeToggle />


                </div>
            </div>
        </header>
    );
}
