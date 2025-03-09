import Link from 'next/link';

const Header = () => {
  return (
    <header className="bg-green-800 text-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold">
            <Link href="/" className="hover:text-green-300 transition">
              ⛳ Golf 3D
            </Link>
          </h1>
        </div>
        <nav className="space-x-6">
          <Link href="/" className="hover:text-green-300 transition">
            Home
          </Link>
          <Link href="/game" className="hover:text-green-300 transition">
            Play Game
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
