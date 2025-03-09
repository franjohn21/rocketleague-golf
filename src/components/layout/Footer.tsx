const Footer = () => {
  return (
    <footer className="bg-green-800 text-white mt-auto">
      <div className="container mx-auto px-4 py-4 text-center">
        <p className="text-sm">
          © {new Date().getFullYear()} 3D Golf Game | Built with Next.js, React, Three.js, and Tailwind CSS
        </p>
        <p className="text-xs mt-1 text-green-300">
          Use arrow keys to adjust aim | Space to swing
        </p>
      </div>
    </footer>
  );
};

export default Footer;
